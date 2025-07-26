let weijin = {};
weijin.showRightMenu = function (isTrue, x = 0, y = 0) {
    let $rightMenu = document.getElementById('rightMenu');
    $rightMenu.style.top = x + 'px';
    $rightMenu.style.left = y + 'px';

    if (isTrue) {
        $rightMenu.style.display="block";
    } else {
        $rightMenu.style.display="none";
    }
}
// 右键菜单事件
if (!(navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i))) {
    window.oncontextmenu = function (event) {
        var rightMenu_group_hide = document.getElementsByClassName('rightMenu-group.hide');
        for (var i=0;i<rightMenu_group_hide.length;i++) {
            rightMenu_group_hide[i].style.display="none";
        }
        if (document.getSelection().toString()) {
            document.getElementById('menu-tools').style.display="block";
        }
        if (event.ctrlKey) return true;
        if (localStorage.getItem("right_menu_switch") === 'off') return true
        let pageX = event.clientX + 10;
        let pageY = event.clientY;
        let rmWidth = document.getElementById('rightMenu').style.width;
        let rmHeight = document.getElementById('rightMenu').style.height;
        if (pageX + rmWidth > window.innerWidth) {
            pageX -= rmWidth + 10;
        }
        if (pageY + rmHeight > window.innerHeight) {
            pageY -= pageY + rmHeight - window.innerHeight;
        }



        weijin.showRightMenu(true, pageY, pageX);
        return false;
    };

    window.addEventListener('click', function () { weijin.showRightMenu(false); });
}
