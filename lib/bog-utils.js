'use strict';

var fs = require('fs'),
    xmldom = require('xmldom'),
    DOMParser = xmldom.DOMParser,
    XMLSerializer = xmldom.XMLSerializer,
    NodeZip = require('node-zip');

function Bog(doc) {
  this.$doc = doc;
}

function matches(elem, slotName) {
  if (!elem.attributes) {
    return false;
  }

  // when slot path starts with / (station root) then the first slot name
  // is an empty string
  if (!slotName) {
    return true;
  }

  if (elem.getAttribute('n') === slotName) {
    return true;
  }
}

function getChildBySlotName(elem, slotName) {
  var kids = elem.childNodes, kid, i;

  for (i = 0; i < kids.length; i++) {
    kid = kids[i];

    if (matches(kid, slotName)) {
      return kid;
    }
  }
}

function select(doc, elem, selector, append) {
  var split = selector.split('/'),
      slotName = split[0],
      kid = getChildBySlotName(elem, slotName);

  if (kid) {
    if (split.length === 1) {
      return kid;
    } else {
      return select(doc, kid, split.slice(1).join('/'), append);
    }
  }
  
  if (split.length === 1 && append) {
    //append final selector as default
    kid = doc.createElement('p');
    kid.setAttribute('n', slotName);
    elem.appendChild(kid);
    return kid;
  }
}

Bog.prototype.select = function (selector) {
  return select(this.$doc, this.$doc.documentElement, selector, false);
};

Bog.prototype.setValue = function (selector, value) {
  var elem = select(this.$doc, this.$doc.documentElement, selector, true);
  if (elem && typeof value !== undefined) {
    elem.setAttribute('v', String(value));
  }
  return elem;
};

Bog.prototype.addNode = function (selector, name, type) {
  var doc = this.$doc,
      elem = select(doc, doc.documentElement, selector, false),
      kid;
  
  if (elem) {
    kid = getChildBySlotName(elem, name);
    
    if (!kid) {
      kid = doc.createElement('p');
      kid.setAttribute('n', name);
      kid.setAttribute('t', type);
      elem.appendChild(kid);
    }
    
    return kid;
  }
};

/**
 * Writes out raw XML to a bog file.
 *
 * @param {String} bogFileName path to the bog file
 * @param {Function} cb(err) callback when done
 */
Bog.prototype.save = function (bogFileName, cb) {
  var zip = new NodeZip(),
      doc = this.$doc,
      xml = new XMLSerializer().serializeToString(doc),
      data;

  zip.file('file.xml', xml);

  try {
    data = zip.generate({ base64: false, compression: 'DEFLATE' });
  } catch (e) {
    return cb(e);
  }

  fs.writeFile(bogFileName, data, { encoding: 'binary' }, cb);
};

/**
 * Unzip a .bog file and parse it out to an XML document.
 *
 * @param {String} bogFileName path to the bog file
 * @param {Function} cb(err, doc) callback to receive the XML document
 * @returns {Bog} Document parsed by xmldom, passed to callback
 */
function parseBog(bogFileName, cb) {
  fs.readFile(bogFileName, { encoding: 'binary' }, function (err, data) {
    if (err) {
      return cb(err);
    }

    var doc;

    try {
      var zip = new NodeZip(data, { base64: false, checkCRC32: true }),
          xmlFile = zip.files['file.xml'];
      
      if (!xmlFile) {
        return cb(bogFileName + ' did not contain file.xml');
      }

      doc = new DOMParser().parseFromString(xmlFile.asText(), 'text/xml');
    } catch (e) {
      return cb(e);
    }

    return cb(null, new Bog(doc));
  });
}

module.exports = {
  Bog: Bog,
  parseBog: parseBog
};