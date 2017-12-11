$(document).ready(function() {

    var animationTime = 150;
    var initialLoad = true;
    // Sidebar collapse

    var s = {
        'toc': $('.sphinxsidebarwrapper .toctree-l1'),
        'ttc': $('.to-top-container'),
        'sidebar': $('.sphinxsidebar')
    }

    $("#preload").removeClass('preload');
    s.toc.addClass('toctree-closed');
    s.ttc.hide();

    $('.sphinxsidebarwrapper .toctree-l1 > ul').hide();
    $('.sphinxsidebarwrapper .toctree-l1.current > ul').show();
    $('.sphinxsidebarwrapper .toctree-l1.current').addClass('toctree-open');
    $('.sphinxsidebarwrapper .toctree-l1.current').removeClass('toctree-closed');

    var viewPort, sidebarVisible = !!($(document).width() > 1200);
    refreshSidebar();
    $(window).resize(debounce(refreshSidebar, 250));


    function refreshSidebar() {
        viewPort = !!($(document).width() > 1200);

        if(viewPort) {
            if(initialLoad) {
                s.sidebar.addClass('animation-off');
                s.sidebar.addClass('open');
            }

            initialLoad = false;
            $('.sidebar-mini').hide();
            s.sidebar.removeClass('sidebar-hide');
            sidebarVisible=true;
            s.sidebar.delay(animationTime).queue(function(next) {
                if(!initialLoad)
                    s.sidebar.addClass('open')
                s.sidebar.removeClass('animation-off');
                next();
            });
        }
        else
            hideSidebar();
    }

    s.sidebar.css({'visibility': 'visible'});

    s.toc.on('click', function(e) {
        if($(e.target).parent().attr('class').startsWith('toctree-l2'))
            return

        e.preventDefault();
        var c = $($(this).children('ul')[0]);

        $('.sphinxsidebarwrapper .toctree-l1 > ul').slideUp();
        s.toc.removeClass('toctree-open');
        s.toc.addClass('toctree-closed');
        if(!c.is(":visible")) {
            c.slideDown();
            $(this).addClass('toctree-open');
            $(this).removeClass('toctree-closed');
        }
    });


    function hideSidebar() {
        s.sidebar.removeClass('open');
        s.sidebar.delay(animationTime).queue(function(next) {
            s.sidebar.addClass('sidebar-hide');
            if(viewPort)
                $('.sidebar-mini').show();
            next();
        });
        sidebarVisible=false;
    }

    function showSidebar(e) {
        if(e) e.stopPropagation();
        $('.sidebar-mini').hide();
        s.sidebar.removeClass('sidebar-hide');
        s.sidebar.delay(0).queue(function(next) {
            $(this).addClass('open');
            next();
        })
        sidebarVisible=true;
    }

    $('.toggle-sidebar').on('click', function() {
        (sidebarVisible)?hideSidebar():showSidebar();
    });

    $('.sidebar-mini, .searchbox-mobile-menu').on('click', showSidebar);

    s.ttc.on('click', function() {
        $('.documentwrapper').scrollTop(0);
    });

    $('.documentwrapper').on("scroll", function() {
        ($('.documentwrapper').scrollTop() <= 0)?s.ttc.fadeOut(animationTime):s.ttc.fadeIn(animationTime);
    });



    $('.documentwrapper, .header-container').on('click', function(e) {
        if(viewPort || ($(e.target).attr('class') == 'toggle-sidebar'))
            return
        hideSidebar();
    });

    // Search on icon click

    $('form#searchform .search-icon').on('click', function() {
        $("form#searchform").submit();
    })

    // Logo link

    $("#global-logo").on('click', function() {
        var path = window.location.pathname.split('/');
        if(path.length)
            return goTo(window.location.origin + '/' + path[1]);
        return goTo(window.location.origin);
    });

    // Version toggle

    function goTo(url) {
        window.location.href = url;
    }

    $(".switch-version").on('change', function() {
        var version = $($(this).children('option:selected')[0]).attr('value');
        var urlDefault = [window.location.origin, version, ''].join('/');
        var url = [window.location.origin, version, window.location.pathname.substring(1)].join('/');
        $.ajax({method: 'HEAD', url: url}).done(function() {
            goTo(url);
        }).fail(function() {
            goTo(urlDefault);
        })
    });

    // Tag current version

    var path = window.location.pathname.split('/');
    var sel;
    if(window.location.pathname.split('/').length) {
        sel = $('#opt-' + path[1].replace('/', '-'));
        if(sel.length)
            $('#opt-' + path[1].replace('/', '-')).prop('selected', 'selected');
    }
});

function debounce(f, delay) {
	var t;
	return function() {
		var ctx = this,
            args = arguments;
		clearTimeout(t);
		t = setTimeout(function() {
            t=null;
            f.apply(ctx, args);
        }, delay);
	};
};


/* IE Polyfill */
String.prototype.endsWith = function(pattern) {
  var d = this.length - pattern.length;
  return d >= 0 && this.lastIndexOf(pattern) === d;
};
String.prototype.startsWith = function(pattern) {
  return this.indexOf(pattern) === 0;
};
