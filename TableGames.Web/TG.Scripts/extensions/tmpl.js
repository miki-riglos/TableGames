define(['jquery'], function($) {

    return {
        load: function(name, req, onLoad, config) {
            var parts = name.split('/');
            var fileUrl = '../GameTemplate?gameName=' + parts[0] + '&fileName=' + parts[1];

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