// helper to generate a URL with query parameters
function getUrlWithParams(url: string, params: { [x: string]: string }) {
  if (url.indexOf("?") < 0) url += "?";
  url += Object.keys(params)
    .map(key => key + "=" + params[key])
    .join("&");
  return url;
}

// JSON define
type JSONValueType =
  | string
  | number
  | boolean
  | JSONValueTypeArray
  | JSONValueTypeObject;
type JSONValueTypeArray = Array<JSONValueType>;
interface JSONValueTypeObject {
  [key: string]: JSONValueType;
}

// deep copy a message
function copy(message: JSONValueType) {
  return JSON.parse(JSON.stringify(message));
}

export { getUrlWithParams, copy };
