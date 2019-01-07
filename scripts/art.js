$(function() {
    //----- OPEN
    $('[data-popup-open]').on('click', function(e)  {
        var targeted_popup_class = jQuery(this).attr('data-popup-open');
        $('[data-popup="' + targeted_popup_class + '"]').fadeIn(350);
 
        e.preventDefault();
    });
 
    //----- CLOSE
    $(document).on('click', function(e) {
        var all_popups = $(document).find('.popup');
        var i;
        for (i = 0; i < all_popups.length; i++) {
            // display: only look at popup displays that are on
            // opacity: don't close transitioning popups
            if ($(all_popups[i]).prop("style")['display'] == 'block' && 
                $(all_popups[i]).prop("style")['opacity'] == "") {
                var close_popup = $(all_popups[i]).find("[data-popup-close]");
                var targeted_popup_class = $(close_popup).attr('data-popup-close');

                $('[data-popup="' + targeted_popup_class + '"]').fadeOut(350);
                console.log("close");
                e.preventDefault();

                console.log();
            }
        }
    })
});
