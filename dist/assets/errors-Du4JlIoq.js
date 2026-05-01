function i(t,e="Something went wrong"){if(typeof t=="object"&&t&&"message"in t){const n=t.message;if(typeof n=="string"&&n.trim())return n}return typeof t=="string"&&t.trim()?t:e}export{i as g};
