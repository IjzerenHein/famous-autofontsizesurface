/**
 * This Source Code is licensed under the MIT license. If a copy of the
 * MIT-license was not distributed with this file, You can obtain one at:
 * http://opensource.org/licenses/mit-license.html.
 *
 * @author: Hein Rutjes (IjzerenHein)
 * @license MIT
 * @copyright Gloey Apps 2015
 */

/**
 * @module
 */
define(function(require, exports, module) {

    // import dependencies
    var Surface = require('famous/core/Surface');
    var Timer = require('famous/utilities/Timer');

    /**
     * @class
     * @extends AutoFontSizeSurface
     * @param {Object} [options] Configuration options
     */
    function AutoFontSizeSurface(options) {
        if (!options.fontSizeRange) {
            throw 'No fontSizeRange specified';
        }
        this.debug = options.debug;
        this._fontSize = options.initialFontSize;
        this._fontSizeUnit = 'px';
        this._invalidated = true;
        this._oldCachedSize = [0, 0];
        _createHiddenSurface.call(this);
        Surface.apply(this, arguments);
        this._recalcTrigger = AutoFontSizeSurface.recalcTrigger;
    }
    AutoFontSizeSurface.prototype = Object.create(Surface.prototype);
    AutoFontSizeSurface.prototype.constructor = AutoFontSizeSurface;

    /**
     * Causes all AutoFontSizeSurfaces to recalculate their font-sizes.
     * Use this method to for instance recalc after a font has been loaded.
     */
    AutoFontSizeSurface.refreshAll = function() {
      AutoFontSizeSurface.recalcTrigger++;
    };
    AutoFontSizeSurface.recalcTrigger = 0;

    /**
     * Create the hidden surface
     */
    function _createHiddenSurface() {
        this._hiddenSurface = new Surface({
            size: [undefined, true]
        });
        this._hiddenSurface.recall = AutoFontSizeSurface.prototype.recall;
        this.setProperties({});
    }

    /**
     * Return render-spec of both this surface and the hidden
     * surface so that they are both rendered.
     *
     * @private
     */
    AutoFontSizeSurface.prototype.render = function() {
        return [this._hiddenSurface.id, this.id];
    };

    /**
     * Finds the optimal font-size using a binary search algorithm.
     * The algorithm first searches in the current range, also gradually
     * increases the steps until it finally uses a binary search.
     */
    function _calcFontSize(size, fontSize) {
        var el = this._hiddenSurface._currentTarget;
        var lowerBound = this._fontSizeRange[0];
        var upperBound = this._fontSizeRange[1];
        fontSize = fontSize || 15; // initial value
        fontSize = Math.min(Math.max(fontSize, lowerBound), upperBound);
        var fontSizeStr = fontSize + this._fontSizeUnit;
        var maxStepSize = 1;
        if (el.style.fontSize !== fontSizeStr) {
          el.style.fontSize = fontSizeStr;
        }
        if (this.debug) {
          console.log('initial font-size: ' + fontSize); //eslint-disable-line no-console
        }
        while (lowerBound < upperBound) {

            //too small (or just exactly right...), try bigger fonts
            if ((el.clientHeight < size[1]) && (el.scrollWidth <= Math.ceil(size[0]))) {
                lowerBound = Math.max(lowerBound, fontSize);
                if (lowerBound < upperBound) {
                  fontSize = lowerBound + Math.min(Math.max(1, Math.floor((upperBound - lowerBound) / 2)), maxStepSize);
                  maxStepSize *= 2;
                  fontSizeStr = fontSize + this._fontSizeUnit;
                  el.style.fontSize = fontSizeStr;
                  if (this.debug) {
                    console.log('test font-size: ' + fontSize); //eslint-disable-line no-console
                  }
                }
            }

            //too big, try smaller fonts
            else if ((el.clientHeight > size[1]) || (el.scrollWidth > Math.ceil(size[0]))) {
                upperBound = Math.min(upperBound, fontSize - 1); // decrease upperbound
                if (lowerBound < upperBound) {
                  fontSize = upperBound - Math.min(Math.ceil((upperBound - lowerBound) / 2), maxStepSize);
                  maxStepSize *= 2;
                  fontSizeStr = fontSize + this._fontSizeUnit;
                  el.style.fontSize = fontSizeStr;
                  if (this.debug) {
                    console.log('test font-size: ' + fontSize); //eslint-disable-line no-console
                  }
                }
            }
            else {
              lowerBound = fontSize;
              upperBound = fontSize;
            }
        }
        fontSize = lowerBound;
        fontSizeStr = fontSize + this._fontSizeUnit;
        if (el.style.fontSize !== fontSizeStr) {
          el.style.fontSize = fontSizeStr;
        }
        if (this.debug) {
          console.log('settled on font-size: ' + fontSize); //eslint-disable-line no-console
        }
        return fontSize;
    }

    /**
     * Apply changes from this component to the corresponding document element.
     * This includes changes to classes, styles, size, content, opacity, origin,
     * and matrix transforms.
     *
     * @private
     * @param {Context} context commit context
     */
    AutoFontSizeSurface.prototype.commit = function(context) {
        Surface.prototype.commit.apply(this, arguments);

        // Check if height has been changed
        if ((this._oldCachedSize[0] !== context.size[0]) ||
            (this._oldCachedSize[1] !== context.size[1])) {
            this._oldCachedSize[0] = context.size[0];
            this._oldCachedSize[1] = context.size[1];
            this._invalidated = true;
        }
        if (this._recalcTrigger !== AutoFontSizeSurface.recalcTrigger) {
          this._recalcTrigger = AutoFontSizeSurface.recalcTrigger;
          this._invalidated = true;
        }

        // Caluclate preferred height
        if (this._currentTarget && this._hiddenSurface._currentTarget && this._invalidated) {
            var hiddenEl = this._hiddenSurface._currentTarget;
            hiddenEl.innerHTML = this._currentTarget.innerHTML;
            this._invalidated = false;
            var fontSize = _calcFontSize.call(this, context.size, this._fontSize);
            var fontSizeStr = fontSize + this._fontSizeUnit;
            if (this._currentTarget.style.fontSize !== fontSizeStr) {
              this._currentTarget.style.fontSize = fontSizeStr;
            }
            if (this._fontSize !== fontSize) {
              this._fontSize = fontSize;
              this._eventOutput.emit('fontSizeChanged', this._fontSize);
            }

            // The first time this surfaces was commited to the DOM, recalc after a second
            // allowing the browser to fetch the used the font if neccessary.
            if (!this._firstCommit) {
                this._firstCommit = true;
                Timer.setTimeout(function() {
                    this._invalidated = true;
                }.bind(this), 100);
            }
        }
    };

    /**
     * Called when the surface is recalled from the DOM. Removes the font-size style.
     *
     * @private
     */
    AutoFontSizeSurface.prototype.recall = function(target) {
      target.style.fontSize = '';
      this._invalidated = true;
      return Surface.prototype.recall.apply(this, arguments);
    };

    /**
     * Copy set properties to hidden surface and ensure that it stays hidden.
     *
     * @private
     */
    AutoFontSizeSurface.prototype.setProperties = function setProperties(properties) {
        properties = properties || {};
        var hiddenProperties = {};
        for (var key in properties) {
            hiddenProperties[key] = properties[key];
        }
        hiddenProperties.visibility = 'hidden';
        this._hiddenSurface.setProperties(hiddenProperties);
        this._invalidated = true;
        return Surface.prototype.setProperties.apply(this, arguments);
    };

    /**
     * Override methods and forward to hidden surface, so that they use the
     * same settings.
     *
     * @private
     */
    AutoFontSizeSurface.prototype.setAttributes = function setAttributes(attributes) {
        this._invalidated = true;
        this._hiddenSurface.setAttributes(attributes);
        return Surface.prototype.setAttributes.apply(this, arguments);
    };

    /**
     * @private
     */
    AutoFontSizeSurface.prototype.addClass = function addClass(className) {
        this._invalidated = true;
        this._hiddenSurface.addClass(className);
        return Surface.prototype.addClass.apply(this, arguments);
    };

    /**
     * @private
     */
    AutoFontSizeSurface.prototype.removeClass = function removeClass(className) {
        this._invalidated = true;
        this._hiddenSurface.removeClass(className);
        return Surface.prototype.removeClass.apply(this, arguments);
    };

    /**
     * @private
     */
    AutoFontSizeSurface.prototype.toggleClass = function toggleClass(className) {
        this._invalidated = true;
        this._hiddenSurface.toggleClass(className);
        return Surface.prototype.toggleClass.apply(this, arguments);
    };

    /**
     * @private
     */
    AutoFontSizeSurface.prototype.setClasses = function setClasses(classList) {
        this._invalidated = true;
        var hiddenClassList = classList.concat(['hiddenAutoFontSizeSurface']);
        this._hiddenSurface.setClasses(hiddenClassList);
        return Surface.prototype.setClasses.apply(this, arguments);
    };

    /**
     * @private
     */
    AutoFontSizeSurface.prototype.setContent = function setContent(content) {
        this._invalidated = true;
        return Surface.prototype.setContent.apply(this, arguments);
    };

    /**
     * @private
     */
    AutoFontSizeSurface.prototype.setOptions = function setOptions(options) {
        this._invalidated = true;
        this._hiddenSurface.setOptions(options);
        if (options.fontSizeRange) {
            this._fontSizeRange = options.fontSizeRange;
        }
        if (options.fontSizeUnit) {
            this._fontSizeUnit = options.fontSizeUnit;
        }
        return Surface.prototype.setOptions.apply(this, arguments);
    };

    /**
     * Returns the font-size range that has been set.
     */
    AutoFontSizeSurface.prototype.getFontSizeRange = function() {
        return this._fontSizeRange;
    };

    /**
     * Returns the font-size range that has been set.
     */
    AutoFontSizeSurface.prototype.getFontSizeUnit = function() {
        return this._fontSizeUnit;
    };

    /**
     * Returns the current calculated the font-size.
     */
    AutoFontSizeSurface.prototype.getFontSize = function() {
        return this._fontSize;
    };

    module.exports = AutoFontSizeSurface;
});
