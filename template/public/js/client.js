var pomelo = window.pomelo;
var name;
var pwd;

function showLogin(){
	$("#loginPanel").show();
	$("#userPanel").hide();
};

function showUser(){
	$("#loginPanel").hide();
	$("#userPanel").show();
};

$(document).ready(function () {

		showLogin();
		$("#login").click(function (){
			name = $("#loginUser").attr("value");
			pwd = $("#loginPwd").attr("value");
			if (!name) {
			$("#loginInfo").text("请输入用户名!");
			return;
			}
			pomelo.init({socketUrl:window.__front_address__, log:true}, function () {
				pomelo.request({
route:"connector.loginHandler.login",
username:name, password:pwd
}, function (data) {
showUser();
$("#userInfo").text("Welcome to pomelo:" + data.user);
enterArea();
});
				});
			});
});

function enterArea() {
	pomelo.init({socketUrl:window.__front_address__, log:true}, function () {
			pomelo.request({
route:"area.areaHandler.createPlayer",
uid:"123", name:"pomelo"
}, function (data) {
$("#areaInfo").text("Your userId is:" + data.user);
});
			});
}
