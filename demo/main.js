/**
 * This Source Code is licensed under the MIT license. If a copy of the
 * MIT-license was not distributed with this file, You can obtain one at:
 * http://opensource.org/licenses/mit-license.html.
 *
 * @author: Hein Rutjes (IjzerenHein)
 * @license MIT
 * @copyright Gloey Apps, 2015
 */

define(function(require) {
    'use strict';

    // import dependencies
    var Engine = require('famous/core/Engine');
    var Modifier = require('famous/core/Modifier');
    var StateModifier = require('famous/modifiers/StateModifier');
    var AutoFontSizeSurface = require('famous-autofontsizesurface/AutoFontSizeSurface');

    var mainContext = Engine.createContext();

    var mod = new Modifier({
        proportions: [0.5, 0.5],
        align: [0.1, 0.1],
        origin: [0.1, 0.1]
    });
    var mod2 = new StateModifier();
    mod2.setProportions([1, 1]);
    for (var i = 0; i < 5; i++) {
        mod2.setProportions([0.5, 0.5], {duration: 3000});
        mod2.setProportions([1, 1], {duration: 3000});
    }

    var autoFontSizeSurface = new AutoFontSizeSurface({
        fontSizeRange: [8, 50],
        classes: ['border'],
        content: 'Lorem ipsum dolor sit amet, alii ludus persius no eos, cum oblique blandit ea. Est ei iuvaret placerat, ius an eruditi dissentiet philosophia, ex quodsi ancillae delicatissimi eam. Vis ad omnis constituto posidonium, sed verear malorum convenire id. Nam dolore fastidii in, unum euismod concludaturque quo et.'
    });

    mainContext.add(mod).add(mod2).add(autoFontSizeSurface);
});
