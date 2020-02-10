module.exports = {
  if_equals: function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  },
  if_not_equals: function(arg1, arg2, options) {
    return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
  },
  if_not: function(arg1, options) {
    return !arg1 ? options.fn(this) : options.inverse(this);
  },
  if_in_list: function(symbol, list, options) {
    return list.includes(symbol) ? options.fn(this) : options.inverse(this);
  }
}
