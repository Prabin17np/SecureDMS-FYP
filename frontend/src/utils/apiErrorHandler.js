// src/utils/apiErrorHandler.js
//
// Every page that calls the API needs to answer the same question:
// "what do I show the user when this fails?" Centralizing that
// logic here means no page ever accidentally renders a raw backend
// error, a stack trace, or a database message - only what this
// function decides is safe to show.
//
// The backend already takes care not to leak internals (see
// authController.js / documentController.js - generic messages,
// no error.message ever sent to the client), but having this layer
// too means the frontend doesn't silently start displaying
// err.message from some future endpoint that isn't as careful.

export function parseApiError(error) {
  // No response at all - network failure, backend not reachable, CORS
  // misconfiguration, etc. Never expose the raw error/network detail.
  if (!error.response) {
    return {
      status: null,
      message: 'Unable to reach the server. Please check your connection and try again.',
      fieldErrors: [],
      locked: false,
    };
  }

  const { status, data } = error.response;

  // express-validator failures arrive as { success, message, errors: [{field, message}] }
  const fieldErrors = Array.isArray(data?.errors) ? data.errors : [];

  return {
    status,
    message: data?.message || 'Something went wrong. Please try again.',
    fieldErrors,
    // The backend distinguishes a locked account from bad credentials
    // via STATUS CODE (403 vs 401), not a field in the response body
    // (see authController.js login handler) - so that's what we check
    // here, not data.locked, which the backend never actually sends.
    locked: status === 403,
  };
}

// Convenience: turn the fieldErrors array into { fieldName: message }
// so form components can do fieldErrorMap.email without looping
// through the array themselves on every render.
export function toFieldErrorMap(fieldErrors) {
  return fieldErrors.reduce((map, err) => {
    map[err.field] = err.message;
    return map;
  }, {});
}
