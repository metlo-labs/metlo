import Error400BadRequest from "./error-400-bad-request";
import Error404NotFound from "./error-404-not-found";

export type ClientError = Error400BadRequest | Error404NotFound;

export const ClientErrorTypes = [Error400BadRequest, Error404NotFound];
