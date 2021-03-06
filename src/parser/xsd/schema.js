'use strict';

var _ = require('lodash');
var assert = require('assert');
var XSDElement = require('./xsdElement');
var helper = require('./../helper');
var Set = helper.Set;

class Schema extends XSDElement {
  constructor(nsName, attrs, options) {
    super(nsName, attrs, options);
    this.complexTypes = {}; // complex types
    this.simpleTypes = {}; // simple types
    this.elements = {}; // elements
    this.includes = []; // included or imported schemas
    this.groups = {};
    this.attributes = {};
    this.attributeGroups = {};
  }

  merge(source) {
    assert(source instanceof Schema);
    if (this.$targetNamespace === source.$targetNamespace) {
      _.merge(this.complexTypes, source.complexTypes);
      _.merge(this.simpleTypes, source.simpleTypes);
      _.merge(this.elements, source.elements);
      _.merge(this.groups, source.groups);
      _.merge(this.attributes, source.attributes);
      _.merge(this.attributeGroups, source.attributeGroups);
      // Multiple files may contribute to the final schema definition, each of these may redfine various namespace
      // aliases; this appears to cause problems with identifying types. Preventing the merge appears to give a more
      // predictable result, but may introduce other issues.
      // _.merge(this.xmlns, source.xmlns);
    }
    return this;
  }

  addChild(child) {
    var name = child.$name;
    if (child.getTargetNamespace() === helper.namespaces.xsd &&
      name in helper.schemaTypes)
      return;
    switch (child.name) {
      case 'include':
      case 'import':
        var location = child.$schemaLocation || child.$location;
        if (location) {
          this.includes.push({
            namespace: child.$namespace || child.$targetNamespace
            || this.$targetNamespace,
            location: location
          });
        }
        break;
      case 'complexType':
        this.complexTypes[name] = child;
        break;
      case 'simpleType':
        this.simpleTypes[name] = child;
        break;
      case 'element':
        this.elements[name] = child;
        break;
      case 'group':
        this.groups[name] = child;
        break;
      case 'attribute':
        this.attributes[name] = child;
        break;
      case 'attributeGroup':
        this.attributeGroups[name] = child;
        break;
    }
  }

  postProcess(defintions) {
    var visited = new Set();
    visited.add(this);
    this.children.forEach(function(c) {
      visitDfs(defintions, visited, c);
    });
  }
}

function visitDfs(defintions, nodes, node) {
  let visited = nodes.has(node);
  if (!visited && !node._processed) {
    node.postProcess(defintions);
    node._processed = true;

    node.children.forEach(function(child) {
      visitDfs(defintions, nodes, child);
    });
  }
}

Schema.elementName = 'schema';
Schema.allowedChildren = ['annotation', 'element', 'complexType', 'simpleType',
  'include', 'import', 'group', 'attribute', 'attributeGroup'];

module.exports = Schema;
