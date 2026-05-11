/// Deep clones a JSON-like object (Map or List)
dynamic deepClone(dynamic source) {
  if (source is Map) {
    return source.map((key, value) => MapEntry(key, deepClone(value)));
  } else if (source is List) {
    return source.map(deepClone).toList();
  }
  return source;
}
