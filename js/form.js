import '../vendor/pristine/pristine.min.js';
import { initEffects, initScale, resetEffects } from './image-effects.js';
import { sendData } from './api.js';
import { showMessage } from './show-message.js';
import { isEscapeKey } from './utils.js';

const MAX_HASHTAGS = 5;
const MAX_COMMENT_LENGTH = 140;
const VALID_HASHTAG_PATTERN = /^#[a-zа-яё0-9]{1,19}$/i;

const uploadForm = document.querySelector('.img-upload__form');
const uploadOverlay = uploadForm.querySelector('.img-upload__overlay');
const uploadInput = uploadForm.querySelector('.img-upload__input');
const uploadCancel = uploadForm.querySelector('.img-upload__cancel');
const hashtagInput = uploadForm.querySelector('.text__hashtags');
const commentInput = uploadForm.querySelector('.text__description');

const pristine = new Pristine(uploadForm, {
  classTo: 'img-upload__field-wrapper',
  errorTextParent: 'img-upload__field-wrapper',
  errorTextClass: 'img-upload__error-text',
});

const validateHashtags = (value) => {
  if (!value) {
    return true;
  }

  const hashtags = value.toLowerCase().trim().split(/\s+/);

  if (hashtags.length > MAX_HASHTAGS) {
    return false;
  }

  const uniqueHashtags = new Set(hashtags);
  if (uniqueHashtags.size !== hashtags.length) {
    return false;
  }

  return hashtags.every((hashtag) => VALID_HASHTAG_PATTERN.test(hashtag));
};

const getHashtagsErrorMessage = (value) => {
  if (!value) {
    return '';
  }

  const hashtags = value.toLowerCase().trim().split(/\s+/);

  if (hashtags.length > MAX_HASHTAGS) {
    return 'Нельзя указать больше пяти хэштегов';
  }

  const uniqueHashtags = new Set(hashtags);
  if (uniqueHashtags.size !== hashtags.length) {
    return 'Один и тот же хэштег не может быть использован дважды';
  }

  const invalidHashtag = hashtags.find(
    (hashtag) => !VALID_HASHTAG_PATTERN.test(hashtag)
  );
  if (invalidHashtag) {
    if (invalidHashtag === '#') {
      return 'Хэштег не может состоять только из решётки';
    }
    if (!invalidHashtag.startsWith('#')) {
      return 'Хэштег должен начинаться с символа #';
    }
    if (invalidHashtag.length > 20) {
      return 'Максимальная длина хэштега 20 символов, включая решётку';
    }
    return 'Хэштег может содержать только буквы и цифры';
  }

  return '';
};

const validateComment = (value) => value.length <= MAX_COMMENT_LENGTH;

pristine.addValidator(hashtagInput, validateHashtags, getHashtagsErrorMessage);

pristine.addValidator(
  commentInput,
  validateComment,
  'Комментарий не может быть длиннее 140 символов'
);

const blockSubmitButton = () => {
  const submitButton = uploadForm.querySelector('.img-upload__submit');
  submitButton.disabled = true;
  submitButton.textContent = 'Публикую...';
};

const unblockSubmitButton = () => {
  const submitButton = uploadForm.querySelector('.img-upload__submit');
  submitButton.disabled = false;
  submitButton.textContent = 'Опубликовать';
};

function closeUploadOverlay() {
  uploadOverlay.classList.add('hidden');
  document.body.classList.remove('modal-open');
  uploadForm.reset();
  pristine.reset();
  resetEffects();
  document.removeEventListener('keydown', onEscKeyDown);
}

function onEscKeyDown(evt) {
  if (isEscapeKey(evt)) {
    closeUploadOverlay();
  }
}

const onUploadInputChange = () => {
  uploadOverlay.classList.remove('hidden');
  document.body.classList.add('modal-open');
  document.addEventListener('keydown', onEscKeyDown);
  initEffects();
  initScale();
};

const onUploadFormSubmit = async (evt) => {
  evt.preventDefault();

  if (!pristine.validate()) {
    return;
  }

  try {
    blockSubmitButton();
    await sendData(new FormData(uploadForm));
    unblockSubmitButton();
    closeUploadOverlay();
    showMessage('success');
  } catch (err) {
    unblockSubmitButton();
    showMessage('error');
  }
};

const preventEscClose = (evt) => {
  if (isEscapeKey(evt)) {
    evt.stopPropagation();
  }
};

uploadInput.addEventListener('change', onUploadInputChange);
uploadCancel.addEventListener('click', closeUploadOverlay);
uploadForm.addEventListener('submit', onUploadFormSubmit);
hashtagInput.addEventListener('keydown', preventEscClose);
commentInput.addEventListener('keydown', preventEscClose);

export { closeUploadOverlay };
