/** Todas la funciones globales Helpers para */

var register = function (Handlebars) {
    var helpers = {
        list: function (items, options)  {
            const itemsAsHtml = items.map(item => "<li>" + options.fn(item) + "</li>");
            return "<ul>\n" + itemsAsHtml.join("\n") + "\n</ul>";
        }
        
    };

    if (Handlebars && typeof Handlebars.registerHelper === "function") {
        for (var prop in helpers) {
            Handlebars.registerHelper(prop, helpers[prop]);
        }
    } else {
        return helpers;
    }

};

module.exports.register = register;
