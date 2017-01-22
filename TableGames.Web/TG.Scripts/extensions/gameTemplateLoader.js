define(['jquery'], function($) {

    return {
        load: function(name, req, onLoad, config) {
            var data = {
                fileName: name
            };

            var parts = name.split('/');
            if (parts.length > 1) {
                data.gameName = parts[0];
                data.fileName = parts[1];
            }

            var fileUrl = '/GameTemplate?' + $.param(data);

            req(['text!' + fileUrl], function(templateText) {
                var $container = $(templateText);

                var $style = $container.filter('style');

                var $template = $container.filter('template');
                var templateName = $template.attr('id');

                $('body').append($style, $template);

                onLoad(templateName);
            });
        }
    };

});