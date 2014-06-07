/**
 * A property descriptor for building editor property sheets.
 */
ds.models.property = function(data) {

  var self = limivorous.observable()
                       .property('name')
                       .property('display')
                       .property('type')
                       .property('template')
                       .build()

  if (data) {
    self.name = data.name
    self.display = data.display
    if (self.name && !self.display)
      self.display = self.name
    self.type = data.type
    self.template = data.template
  }

  self.render = function(item) {
    var template = self.template || ds.templates.edit.properties[self.name]
    if (template && template instanceof Function) {
      return template({property: self, item: item})
    } else {
      return item[self.display] || ''
    }
  }

  return self
}