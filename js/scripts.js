$( document ).ready(function() {
    init();
});

$( "button.nav-link.icon-button" ).on( "click", handleNavMobileNavLinkClick);
$( "h4.topic" ).on( "click", handleNavMobileNavLinkClick);
const headerMenu = document.getElementById("navbarSupportedContent");

function init() {
    var activeTab = $(".navbar-nav .nav-item.active[data-role='nav-menu-tab']")[0];
    var activeTabPanelId = activeTab && activeTab.dataset ? activeTab.dataset.targetTabPanelId : null;
    if (activeTabPanelId) showMainPageTab(activeTabPanelId);
    
    $(".navbar-nav .nav-item[data-role='nav-menu-tab']").on("click", handleTabChange);
    $( "h4.topic" ).on( "click", handleTabChange);
    $( "h6.trynow" ).on( "click", handleTabChange);
}

function handleTabChange(e) {
    var { targetTabPanelId } = e.currentTarget.dataset;
    $(".navbar-nav .nav-item[data-role='nav-menu-tab']").removeClass("active");
    $(".navbar-nav .nav-item[data-target-tab-panel-id='" + targetTabPanelId + "']").addClass("active");
    
    targetTabPanelId =="about" ? $("#alert-container").addClass("hide") : $("#alert-container").removeClass("hide") 

    if (targetTabPanelId) {
        hideAllMainPageTabs();
        showMainPageTab(targetTabPanelId);
    }
    window.scrollTo(0,0)
}

function hideAllMainPageTabs() {
    $(".main-page-tab-panel").hide();
}

function showMainPageTab(tabPanelId) {
    $(".main-page-tab-panel[data-tab-panel-id='" + tabPanelId + "']").fadeIn();
}

function handleNavMobileNavLinkClick() {
    if ($(headerMenu).hasClass( "show" )) {
        $(headerMenu).collapse('hide');
    }
}