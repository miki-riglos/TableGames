define(['jquery'], function($) {

    return {
        load: function(name, req, onLoad, config) {
            req(['text!' + name + '.html'], function(templateText) {
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