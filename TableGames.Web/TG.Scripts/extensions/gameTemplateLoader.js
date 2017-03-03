define(['jquery', 'extensions/gameNameParser'], function($, gameNameParser) {

    return {
        load: function(name, req, onLoad, config) {
            var fileUrl = '/GameResource?' + $.param(gameNameParser(name, "html"));


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