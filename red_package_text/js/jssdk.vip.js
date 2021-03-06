var path="https://api.fentuapp.com.cn/"; //正式环境
//var path="http://192.168.1.167/fentu_server/public/"; //测试环境
function init(rid,code) {
    var token=JSON.parse(sessionStorage.getItem("userinfo"));
    loading();
    if(token){
        getRedPacket(rid,token)
        wxShare(window.location.href.split("#")[0],rid, token)
    }else{
        getUserinfo(code)
    }
}
function getUserinfo(code) {
    $.post(path+"Login/wechatLogin",{"code":code,"type":"4"},function (data) {
        var userinfo = data;
        if (userinfo.ret == 0) {
            saveUserinfo(userinfo.data)
        } else {
            confiremError();
            console.log("error:登陆失败")
        }
    })
}
function saveUserinfo(userinfo) {
    sessionStorage.setItem("userinfo", JSON.stringify(userinfo));
    var Request = new Object();
    Request = GetRequest();
    getRedPacket(Request["rid"],userinfo);
    wxShare(window.location.href.split("#")[0], Request["rid"], userinfo)
}

function getRedPacket(rid,token){
    //红包详情传token反回领取状态
    $.getJSON(path+"Redpacket/redpacketDetails",{"redpacketId":rid,"token":token.token},function (data) {
        // 成功
        if(data.errcode==0){
            var items = data.data;
            if(items.code==0){
                //红包未领取
                resultRpk(items);
                removeloading();
                $(".red-pk .contet").show()
            }else{
                sessionStorage.setItem("ojb", JSON.stringify(items))
                var gohref = "vipopenredpk.html?text=" + items.code + "&rid=" + rid;
                location.href = gohref
            }
        }else{
            confiremError()
        }
    })
}
var details; //红包详情
function resultRpk(ojb) {
    $(".red-pk .title").text(ojb.intro);
    $(".red-pk .head p").text(ojb.user_name);
    $(".red-pk .head img").attr({
        "src": ojb.avatar
    });
    sessionStorage.setItem("ojb", JSON.stringify(ojb))
    details=ojb;
}
function openRed() {
    var token=JSON.parse(sessionStorage.getItem("userinfo"));
    $(".open-redpk").css({"pointer-events":"none"});
    $(".open-red").addClass("change").one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",
        function() {
            $(this).removeClass("change")
            $(".open-redpk").css({"pointer-events":"auto"});
            if(details.is_use_gps==2){
                wx.getLocation({
                    success: function (res) {
                        var latitude = res.latitude; // 纬度，浮点数，范围为90 ~ -90
                        var longitude = res.longitude; // 经度，浮点数，范围为180 ~ -180。
                        // 领取定位红包
                        $.post(path+"Redpacket/redpacketGet",{"redpacketId":details.redpacket_id,"token":token.token,"x":longitude,"y":latitude,"is_community":1},function (data) {
                            sessionStorage.removeItem("text");
                            if(data.errcode==0){
                                sessionStorage.setItem("text", JSON.stringify(data));
                                var gohref = "vipopenredpk.html?rid=" + details.redpacket_id;
                                location.href = gohref
                            }else{
                                location.href = "404.html"
                            }
                        })
                    },
                    fail:function (res) {
                        location.href = "404.html"
                    },
                    cancel: function (res) {
                        location.href = "404.html"
                    },
                    error:function (res) {
                        location.href = "404.html"
                    }
                });
            }else{
                //领取红包
                $.post(path+"Redpacket/redpacketGet",{"redpacketId":details.redpacket_id,"token":token.token},function (data) {
                    sessionStorage.removeItem("text");
                    if(data.errcode==0){
                        sessionStorage.setItem("text", JSON.stringify(data));
                        var gohref = "vipopenredpk.html?rid=" + details.redpacket_id;
                        location.href = gohref
                    }else{
                        sessionStorage.setItem("text", JSON.stringify(data));
                        var gohref = "vipopenredpk.html?rid=" + details.redpacket_id;
                        location.href = gohref
                    }
                })
            }
        });
}
//红包打开
function getrpk() {
    var items = JSON.parse(sessionStorage.getItem("ojb"));
    var userinfo = JSON.parse(sessionStorage.getItem("userinfo"));
    $(".adimg").attr({"src":items.backimg})
    if(items.backmusic){
        $("#bgmusic").attr({"src":items.backmusic})
    }
    if(userinfo){
        $(".orpk-view .head img").attr({
            "src": items.avatar
        });
        $(".orpk-view .head p").text(items.user_name);
        $(".orpk-view footer .slogan").text(items.intro);
        receiveRedPacket(items);
    }else{
        confiremError();
    }
}
var page=1;
var num=10;
function receiveRedPacket(items) {
    var Request = new Object();
    Request = GetRequest();
    switch(items.code){
        //红包未领取
        case 0:
            var text =JSON.parse(sessionStorage.getItem("text"))
            if(text.errcode==0){
                $(".singlemoney").text(text.data.amount);
            }else{
                $(".orpk-view .content .money p").text("手慢啦，红包已经被抢完啦~");
            }
            break;
        //红包超时
        case 1:
            $(".orpk-view .content .money p").text("当前红包已经过期了，换一个试试吧~");
            break;
        //红包已领完
        case 2:
            $(".orpk-view .content .money p").text("红包已经领取完啦！");
            break;
        //已领取
        case 3:
            $(".orpk-view .content .money p").text("红包已经领取过啦！")
            break;
    }
    if (items.ad_img_url) {
        $(".banner a img").attr({
            "src": items.ad_img_url
        });
        if (items.ad_detail_url) {
            if (items.ad_detail_url.indexOf("http://") >= 0 || items.ad_detail_url.indexOf("https://") >= 0) {
                $(".slogan,.banner a,.adlink a").bind("click",
                    function() {
                        adCheck(items.redpacket_id);
                        location.href = items.ad_detail_url
                    })
            } else {
                $(".slogan,.banner a,.adlink a").bind("click",
                    function() {
                        adCheck(items.redpacket_id);
                        location.href = "http://" + items.ad_detail_url
                    })
            }
        } else {
            $(".banner a").attr({
                "href": "javascript:void(0)"
            });
            $(".adlink").remove();
        }
    } else {
        $(".banner,.adlink").remove();
    }
    $(".share-hint").bind("click",function(){
        var html = "<div class='routing'><div class='content'><div class='minapp-code'><img src='img/cat.png'/></div><img class='close' src='img/close.png'><button>下一个红包</button></div></div>";
        $("body").append(html)
        $(".routing button").bind("click",function(){
            location.href="http://redpacket.fentuapp.com.cn/go.html";
        });
        $(".routing .close").bind("click",function(){
            $(".routing").remove()
        });
    });
    //调用
    resultReceiveRedPacket(items,page,num);
    refresh(items);
}
//广告点击次数
function adCheck(rid){
    $.getJSON(path+"Redpacket/redpacketClick",{"redpacketId":rid},function (data) {});
}
//获取ID
var listId;
// 加载刷新。
function refresh(items) {
    $(window).scroll(function(){
        var scrollTop = $(this).scrollTop();    //滚动条距离顶部的高度
        var scrollHeight = $(document).height();   //当前页面的总高度
        var clientHeight = $(this).height();    //当前可视的页面高度
        if(scrollTop + clientHeight >= scrollHeight){   //距离顶部+当前高度 >=文档总高度 即代表滑动到底部 count++;         //每次滑动count加1
            page++;
            var compare= Math.ceil((items.count-items.residue)/num)
            if(page<=compare){
                resultReceiveRedPacket(items,page,num,listId);
            }
        }
    });
}
function resultReceiveRedPacket(items,page,num,id) {
    //领取人列表
    $.getJSON(path+"Redpacket/redpacketGetList",{"redpacketId":items.redpacket_id,"page":page,"num":num,"id":id},function (data) {
        var list = data.data;
        if(!listId){
            listId=list[0].id
        }
        if(list){
            $(".redpk-num").text("共" + list[0].count + "个红包，剩余" + list[0].residue + "个红包");
            addRedPacketList(list);
        }
        removeloading();
        $(".orpk-view").show()
    })
}
function addRedPacketList(list){
    for (i = 0; i < list.length; i++) {
        var date = new Date(list[i].add_time*1000);
        var html = "<li><img src=" + list[i].avatar + "><p>" + list[i].user_name + "<span>" + ("0" + date.getHours()).slice( - 2) + ":" + ("0" + date.getMinutes()).slice( - 2) + "</span></p><font>" + list[i].amount.toFixed(2) + "元</font></li>";
        $(".redpk-list").append(html)
    }
    console.log($(".redpk-list li").length);
}
function wxShare(url, rid, userinfo) {
    $.getJSON(path+"Jsapi/GetSignPackage",{"url":url},function(result){
        wxConfig(result.data,rid,userinfo)
    });
}
function wxConfig(itmes, rid, userinfo) {
    wx.config({
        debug: false,
        appId: itmes.appid,
        timestamp: itmes.timestamp,
        nonceStr: itmes.nonceStr,
        signature: itmes.signature,
        jsApiList: ["checkJsApi", "onMenuShareTimeline", "onMenuShareAppMessage","getLocation"]
    });
    var redirect_uri = "http://redpacket.fentuapp.com.cn/vipgo.html?rid=" + rid;
    var ojb = JSON.parse(sessionStorage.getItem("ojb"));
    wx.ready(function() {
        var shareData = {
            title: ojb.share_title.replace('#分享者昵称#',userinfo.userName),
            desc: ojb.share_details,
            link: redirect_uri,
            imgUrl: ojb.is_use_icon==1?userinfo.avatar:ojb.share_icon,
            success: function(res) {
                shareRedpacketNum(rid);
            },
            cancel: function(res) {}
        };
        wx.onMenuShareAppMessage({
            title: ojb.share_title.replace('#分享者昵称#',userinfo.userName),
            desc: ojb.share_details,
            link: redirect_uri,
            imgUrl: ojb.is_use_icon==1?userinfo.avatar:ojb.share_icon,
            trigger: function(res) {},
            success: function(res) {
                shareRedpacketNum(rid);
            },
            cancel: function(res) {},
            fail: function(res) {
                console.log(JSON.stringify(res))
            }
        });
        wx.onMenuShareTimeline(shareData)
    });
    wx.error(function(res) {
        console.log("error: " + res.errMsg)
    })
};
//分享统计
function shareRedpacketNum(rid){
    $.getJSON(path+"Redpacket/shareRedpacketNum",{"redpacketId":rid},function(result){
    });
}
function GetRequest() {
    var url = location.search;
    var theRequest = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.substr(1);
        strs = str.split("&");
        for (var i = 0; i < strs.length; i++) {
            theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1])
        }
    }
    return theRequest
}

function removeloading() {
    $(".loading").remove()
}
function closeBrower() {
    $(".loading").remove();
    WeixinJSBridge.invoke("closeWindow", {},
        function(res) {})
}
function loading() {
    var html = "<div class='loading'><div class='windows8'><div class='wBall' id='wBall_1'><div class='wInnerBall'></div></div><div class='wBall' id='wBall_2'><div class='wInnerBall'></div></div><div class='wBall' id='wBall_3'><div class='wInnerBall'></div></div><div class='wBall' id='wBall_4'><div class='wInnerBall'></div></div><div class='wBall' id='wBall_5'> <div class='wInnerBall'></div></div></div></div>";
    $("body").append(html)
}
function is_weixn() {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.match(/MicroMessenger/i) == "micromessenger") {
        return true
    } else {
        return false
    }
}
function confiremError(text) {
    text=typeof text == "undefined"?'请重新扫描二维码领取红包，或刷新浏览器！':text;
    removeloading();
    var html = "<div class='loading errorbg'><div class='error'>" + text + "<p><button onClick='closeBrower()'>关闭</button></p></div></div>";
    $("body").append(html)
}
function confiremText(text) {
    var html = "<div class='loading text-hint'><div class='error'>" + text + "<p><button onClick='closeBrowerText()'>关闭</button></p></div></div>";
    $("body").append(html)
}
function closeBrowerText(){
    $(".loading").remove();
}
function goApp(){
    var u = navigator.userAgent;
    var isAndroid = u.indexOf("Android") > -1 || u.indexOf("Adr") > -1;
    var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
    if (isAndroid) {
        location.href = "http://a.app.qq.com/o/simple.jsp?pkgname=com.billliao.fentu"
    }
    if (isiOS) {
        location.href = "https://itunes.apple.com/cn/app/fen-tu-jiu-gong-ge-qie-tu-shen-qi/id1179260950?mt=8"
    }
}
function mobiledge() {
    var html = "<div class='routing'><div class='content'><div class='minapp-code'><p>识别小程序码，秒速提现到账</p><img src='img/minappcode.jpg'/></div><img class='close' src='img/close.png'></div></div>";
    $("body").append(html)
    $(".routing .close").bind("click",function(){
        $(".routing").remove()
    });
}
//弹幕
function getBarrager(rid,toggle){
    if(toggle){
        $.getJSON(path+"Redpacket/redpacketCommentList",{"redpacketId":rid},function (data) {
            //每条弹幕发送间隔
            var looper_time=1*3000;
            var items=data;
            //弹幕总数
            var total=data.data.length;
            //是否首次执行
            var run_once=true;
            //弹幕索引
            var index=0;
            //先执行一次
            if(items.data.length>0){
                barrager();
            }
            function  barrager(){
                if(run_once){
                    //如果是首次执行,则设置一个定时器,并且把首次执行置为false
                    looper=setInterval(barrager,looper_time);
                    run_once=false;
                }
                //发布一个弹幕
                var item={
                    info:items.data[index].content, //文字
                    href:'javascript:void(0)', //链接
                    close:false, //显示关闭按钮
                    speed:10, //延迟,单位秒,默认6
                    color:'#fff', //颜色,默认白色
                }
                $('body').barrager(item);
                //索引自增
                index++;
                //所有弹幕发布完毕，清除计时器。
                if(index == total){
                    clearInterval(looper);
                    if(index>1){
                        setTimeout("getBarrager('"+rid+"',true)",looper_time)
                    }
                    return false;
                }
            }
        });
    }else{
        clearInterval(looper);
    }
}
//弹幕按钮
function bindBtn(rid){
    $(".on-barrager").bind("click",function(){
        $(".off-barrager").removeClass("hidden");
        $(this).addClass("hidden");
        $toggle=false;
        getBarrager(rid,false);
    });
    $(".off-barrager").bind("click",function(){
        $(".on-barrager").removeClass("hidden");
        $(this).addClass("hidden");
        $toggle=true;
        getBarrager(rid,true);
    });
    $(".barrager-btn-send").bind("click",function(){
        binSend(rid)
    });
};
function binSend(rid){
    var html = "<div class='routing'><div class='content'><div class='minapp-code'><textarea maxlength='20' placeholder='填写您的评论'></textarea></div><button onClick=\"sendBarrager('"+rid+"')\">发表弹幕</button><img class='close' src='img/close.png'></div></div>";
    $("body").append(html)
    $(".routing .close").bind("click",function(){
        $(".routing").remove()
    });
}
function sendBarrager(rid){
    var userinfo=JSON.parse(sessionStorage.getItem("userinfo"));
    var token=userinfo.token;
    var content=$(".minapp-code textarea").val();
    if(content!=""){
        $.getJSON(path+"Redpacket/redpacketCommentAdd",{"redpacketId":rid,"token":token,"content":content},function (data) {
            if(data.errcode==0){
                $(".routing").remove();
                //发布一个弹幕
                var item={
                    info:content, //文字
                    href:'javascript:void(0)', //链接
                    close:false, //显示关闭按钮
                    speed:10, //延迟,单位秒,默认6
                    color:'#fff', //颜色,默认白色
                }
                $('body').barrager(item);
            }else{
                confiremText("弹幕发送失败，请重试一次");
            }
        });
    }else{
        confiremText("评论不能为空哦！");
    }
}
var musicSwitch=true;
function bindMusic(){
    if(musicSwitch){
        $(".music img").attr({"src":"img/musicno.png"});
        musicSwitch=false;
        document.getElementById('bgmusic').pause();
    }else{
        $(".music img").attr({"src":"img/musicoff.png"})
        musicSwitch=true;
        document.getElementById('bgmusic').play();
    }
}
function bindPhone(){
    var items = JSON.parse(sessionStorage.getItem("ojb"));
    if (items.mobile) {
        location.href = 'tel:'+items.mobile;
    }
}

function bindRqcode(){
    var items = JSON.parse(sessionStorage.getItem("ojb"));
    if(items.qr_code){
        var shield = document.createElement("DIV");
        shield.id = "shield";
        shield.style.position = "fixed";
        shield.style.left = "0px";
        shield.style.top = "0px";
        shield.style.width = "100%";
        shield.style.height = "100%";
        shield.style.background = "#333";
        shield.style.textAlign = "center";
        shield.style.zIndex = "19901000";
        shield.style.filter = "alpha(opacity=.5)";
        shield.style.opacity = ".5";
        var rqCode = document.createElement("DIV");
        rqCode.id="rqCode";
        strHtml = "<img src=\'"+items.qr_code+"\'>";
        strHtml += "<p>长按扫描二维码</p>";
        strHtml += "<span><img src='img/call.png' onclick=\"call()\"></span>";
        rqCode.innerHTML = strHtml;
        document.body.appendChild(rqCode);
        document.body.appendChild(shield);
        var c = 0;
        this.doAlpha = function(){
            if (c++ > 20){clearInterval(ad);return 0;}
            shield.style.filter = "alpha(opacity="+c+")";
            shield.style.opacity = ".5";
        }
        var ad = setInterval("doAlpha()",5);
        this.call = function(){
            console.log(call);
            //alertFram.style.display = "none";
            //shield.style.display = "none";
    　　　　document.body.removeChild(rqCode);
            document.body.removeChild(shield);
        }
        rqCode.focus();
        document.body.onselectstart = function(){return false;};
    }
}