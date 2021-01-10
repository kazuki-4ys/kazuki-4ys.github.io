var pd;
var playerIdx;

var reader = new FileReader();
var mainForm = document.getElementById('mainForm');
var friendForm = document.getElementById('friendForm');
var open = document.getElementById('open');
var openBtn = document.getElementById('openBtn');
var save = document.getElementById('save');
var region = document.getElementById('region');
var playerBtns = [];
playerBtns.length = MAX_PLAYER_NUM;
var playerName = document.getElementById('playerName');
var playerFc = document.getElementById('playerFc');
var unlockAll = document.getElementById('unlockAll');
var friends = document.getElementById('friends');
var vr = document.getElementById('vr');
var wfcVSWins = document.getElementById('wfcVSWins');
var wfcVSLosses = document.getElementById('wfcVSLosses');
var br = document.getElementById('br');
var wfcBTWins = document.getElementById('wfcBTWins');
var wfcBTLosses = document.getElementById('wfcBTLosses');
var vCount = document.getElementById('vCount');
var bCount = document.getElementById('bCount');
var itemHitsDelivered = document.getElementById('itemHitsDelivered');
var itemHitsReceived = document.getElementById('itemHitsReceived');
var tricks = document.getElementById('tricks');
var firstPlaceAppearances = document.getElementById('firstPlaceAppearances');
var tournamentsPlayed = document.getElementById('tournamentsPlayed');
var totalDistanceTraveled = document.getElementById('totalDistanceTraveled');

for(var i = 0;i < MAX_PLAYER_NUM;i++){
    playerBtns[i] = document.getElementById('p' + i.toString(10));
}

openBtn.addEventListener('click',(event) => {
    open.value = '';
    open.click();
});

open.addEventListener('change',(event) => {
    var tmp = event.target.files;
    if(tmp){
        var f = tmp[0];
        reader.readAsArrayBuffer(f);
    }
},false);

reader.addEventListener('load',(event) => {
    var buf = new Uint8Array(reader.result);
    var tmpPd = new RKSD(buf);
    if(!tmpPd.valid){
        alert('invalid file');
        return;
    }
    pd = tmpPd;
    playerIdx = -1;
    for(i= 0;i < MAX_PLAYER_NUM;i++){
        if(pd.players[i].valid){
            if(playerIdx == -1)playerIdx = i;
            playerBtns[i].disabled = false;
            if(i == playerIdx){
                playerBtns[i].setAttribute('class','selectedBtn');
            }else{
                playerBtns[i].removeAttribute('class');
            }
        }else{
            playerBtns[i].disabled = true;
            playerBtns[i].setAttribute('class','disabledBtn');
        }
    }
    region.disabled = false;
    region.value = pd.getRegion().toString(10);
    save.disabled = false;
    save.removeAttribute('class');
    if(playerIdx != -1){
        unlockAll.disabled = false;
        unlockAll.removeAttribute('class');
        friends.disabled = false;
        friends.removeAttribute('class');
        vr.disabled = false;
        wfcVSWins.disabled = false;
        wfcVSLosses.disabled = false;
        br.disabled = false;
        wfcBTWins.disabled = false;
        wfcBTLosses.disabled = false;
        vCount.disabled = false;
        bCount.disabled = false;
        itemHitsDelivered.disabled = false;
        itemHitsReceived.disabled = false;
        tricks.disabled = false;
        firstPlaceAppearances.disabled = false;
        tournamentsPlayed.disabled = false;
        totalDistanceTraveled.disabled = false;
        setPlayerUI();
    }else{
        unlockAll.disabled = true;
        unlockAll.setAttribute('class','disabledBtn');
        friends.disabled = true;
        friends.setAttribute('class','disabledBtn');
        vr.disabled = true;
        vr.value = "";
        wfcVSWins.disabled = true;
        wfcVSWins.value = "";
        wfcVSLosses.disabled = true;
        wfcVSLosses.value = "";
        br.disabled = true;
        br.value = "";
        wfcBTWins.disabled = true;
        wfcBTWins.value = "";
        wfcBTLosses.disabled = true;
        wfcBTLosses.value = "";
        vCount.disabled = true;
        vCount.value = "";
        bCount.disabled = true;
        bCount.value = "";
        itemHitsDelivered.disabled = true;
        itemHitsDelivered.value = "";
        itemHitsReceived.disabled = true;
        itemHitsReceived.value = "";
        tricks.disabled = true;
        tricks.value = "";
        firstPlaceAppearances.disabled = true;
        firstPlaceAppearances.value = "";
        tournamentsPlayed.disabled = true;
        tournamentsPlayed.value = "";
        totalDistanceTraveled.disabled = true;
        totalDistanceTraveled.value = "";
        playerName.innerHTML = " ";
        playerFc.innerHTML = " ";
    }
},false);

save.addEventListener('click',(event) => {
    fileSave(pd.save(),'rksys.dat');
});

region.addEventListener('change',(event) => {
    pd.setRegion(Number(region.value));
});

for(var i = 0;i < MAX_PLAYER_NUM;i++){
    playerBtns[i].addEventListener('click',(event) => {
        playerBtns[playerIdx].removeAttribute('class');
        var selfIdx = Number(event.target.getAttribute('id').replace('p',''));
        event.target.setAttribute('class','selectedBtn');
        playerIdx = selfIdx;
        setPlayerUI();
    });
}

unlockAll.addEventListener('click',(event) => {
    pd.players[playerIdx].unlockAll();
    alert('everything unlocked.');
});

friends.addEventListener('click',(event) => {
    showFriendForm();
});

vr.addEventListener('change',(event) => {
    var tmp = ston(vr.value);
    if(tmp > 0 && tmp < 10000){
        pd.players[playerIdx].setVR(tmp);
    }
    vr.value = pd.players[playerIdx].getVR().toString(10);
});

br.addEventListener('change',(event) => {
    var tmp = ston(br.value);
    if(tmp > 0 && tmp < 10000){
        pd.players[playerIdx].setBR(tmp);
    }
    br.value = pd.players[playerIdx].getBR().toString(10);
});

wfcVSWins.addEventListener('change',(event) => {
    var tmp = ston(wfcVSWins.value);
    if(tmp > -1 && tmp < 100000){
        pd.players[playerIdx].setWfcVSWins(tmp);
    }
    wfcVSWins.value = pd.players[playerIdx].getWfcVSWins().toString(10);
});

wfcVSLosses.addEventListener('change',(event) => {
    var tmp = ston(wfcVSLosses.value);
    if(tmp > -1 && tmp < 100000){
        pd.players[playerIdx].setWfcVSLosses(tmp);
    }
    wfcVSLosses.value = pd.players[playerIdx].getWfcVSLosses().toString(10);
});

wfcBTWins.addEventListener('change',(event) => {
    var tmp = ston(wfcBTWins.value);
    if(tmp > -1 && tmp < 100000){
        pd.players[playerIdx].setWfcBTWins(tmp);
    }
    wfcBTWins.value = pd.players[playerIdx].getWfcBTWins().toString(10);
});

wfcBTLosses.addEventListener('change',(event) => {
    var tmp = ston(wfcBTLosses.value);
    if(tmp > -1 && tmp < 100000){
        pd.players[playerIdx].setWfcBTLosses(tmp);
    }
    wfcBTLosses.value = pd.players[playerIdx].getWfcBTLosses().toString(10);
});

vCount.addEventListener('change',(event) => {
    var tmp = ston(vCount.value);
    if(tmp > -1 && tmp < 100000){
        pd.players[playerIdx].setTotalVSCount(tmp);
    }
    vCount.value = pd.players[playerIdx].getTotalVSCount().toString(10);
});

bCount.addEventListener('change',(event) => {
    var tmp = ston(bCount.value);
    if(tmp > -1 && tmp < 100000){
        pd.players[playerIdx].setTotalBTCount(tmp);
    }
    bCount.value = pd.players[playerIdx].getTotalBTCount().toString(10);
});

itemHitsDelivered.addEventListener('change',(event) => {
    var tmp = ston(itemHitsDelivered.value);
    if(tmp > -1 && tmp < 100000){
        pd.players[playerIdx].setItemHitsDelivered(tmp);
    }
    itemHitsDelivered.value = pd.players[playerIdx].getItemHitsDelivered().toString(10);
});

itemHitsReceived.addEventListener('change',(event) => {
    var tmp = ston(itemHitsReceived.value);
    if(tmp > -1 && tmp < 100000){
        pd.players[playerIdx].setItemHitsReceived(tmp);
    }
    itemHitsReceived.value = pd.players[playerIdx].getItemHitsReceived().toString(10);
});

tricks.addEventListener('change',(event) => {
    var tmp = ston(tricks.value);
    if(tmp > -1 && tmp < 100000){
        pd.players[playerIdx].setTricks(tmp);
    }
    tricks.value = pd.players[playerIdx].getTricks().toString(10);
});

firstPlaceAppearances.addEventListener('change',(event) => {
    var tmp = ston(firstPlaceAppearances.value);
    if(tmp > -1 && tmp < 100000){
        pd.players[playerIdx].set1stPlaceAppearances(tmp);
    }
    firstPlaceAppearances.value = pd.players[playerIdx].get1stPlaceAppearances().toString(10);
});

tournamentsPlayed.addEventListener('change',(event) => {
    var tmp = ston(tournamentsPlayed.value);
    if(tmp > -1 && tmp < 10000){
        pd.players[playerIdx].setTournamentsPlayed(tmp);
    }
    tournamentsPlayed.value = pd.players[playerIdx].getTournamentsPlayed().toString(10);
});

totalDistanceTraveled.addEventListener('change',(event) => {
    var tmp = ston(totalDistanceTraveled.value);
    if(tmp > -1 && tmp < 10000000001){
        pd.players[playerIdx].setTotalDistanceTraveled(tmp);
    }
    totalDistanceTraveled.value = pd.players[playerIdx].getTotalDistanceTraveled().toString(10);
});

function setPlayerUI(){
    playerName.innerHTML = pd.players[playerIdx].getName();
    playerFc.innerHTML = pd.players[playerIdx].getFc();
    vr.value = pd.players[playerIdx].getVR().toString(10);
    br.value = pd.players[playerIdx].getBR().toString(10);
    wfcVSWins.value = pd.players[playerIdx].getWfcVSWins().toString(10);
    wfcBTWins.value = pd.players[playerIdx].getWfcBTWins().toString(10);
    wfcVSLosses.value = pd.players[playerIdx].getWfcVSLosses().toString(10);
    wfcBTLosses.value = pd.players[playerIdx].getWfcBTLosses().toString(10);
    vCount.value = pd.players[playerIdx].getTotalVSCount().toString(10);
    bCount.value = pd.players[playerIdx].getTotalBTCount().toString(10);
    itemHitsDelivered.value = pd.players[playerIdx].getItemHitsDelivered().toString(10);
    itemHitsReceived.value = pd.players[playerIdx].getItemHitsReceived().toString(10);
    tricks.value = pd.players[playerIdx].getTricks().toString(10);
    firstPlaceAppearances.value = pd.players[playerIdx].get1stPlaceAppearances().toString(10);
    tournamentsPlayed.value = pd.players[playerIdx].getTournamentsPlayed().toString(10);
    totalDistanceTraveled.value = pd.players[playerIdx].getTotalDistanceTraveled().toString(10);
}

function showFriendForm(){
    friendForm.innerHTML = "<button onclick=\"friendFormClose();\">close</button><br>";
    for(var i = 0;i < MAX_FRIEND_NUM;i++){
        if(!pd.players[playerIdx].friends[i].valid)continue;
        var tmpFriendFormChild = document.createElement("div");
        tmpFriendFormChild.style.display = 'flex';
        tmpFriendFormChild.setAttribute("class","friendFormChild");
        var name = document.createElement("div");
        name.setAttribute('class','friendName');
        name.innerHTML = pd.players[playerIdx].friends[i].getName() + '<br>' + pd.players[playerIdx].friends[i].getFc();
        tmpFriendFormChild.insertBefore(name,null);
        var wins = document.createElement("div");
        wins.innerHTML = "Wins:";
        wins.setAttribute('class','friendFormChildElement');
        tmpFriendFormChild.insertBefore(wins,null);
        var winsInpParent = document.createElement("div");
        winsInpParent.setAttribute('class','friendFormChildElement');
        var winsInp = document.createElement("input");
        winsInp.setAttribute("class","digits4");
        winsInp.setAttribute("maxlength","4");
        winsInp.setAttribute("data-friendIdx",i.toString(10));
        winsInp.value = pd.players[playerIdx].friends[i].getWins().toString(10);
        winsInp.addEventListener('change',(event) => {
            var friendIdx = Number(event.target.getAttribute("data-friendIdx"));
            var tmp = ston(event.target.value);
            if(tmp > -1 && tmp < 10000){
                pd.players[playerIdx].friends[friendIdx].setWins(tmp);
            }
            event.target.value = pd.players[playerIdx].friends[friendIdx].getWins().toString(10);
        });
        winsInpParent.insertBefore(winsInp,null);
        tmpFriendFormChild.insertBefore(winsInpParent,null);
        var div0 = document.createElement("div");
        div0.style.flex = 1;
        tmpFriendFormChild.insertBefore(div0,null);
        var losses = document.createElement("div");
        losses.innerHTML = "Losses:";
        losses.setAttribute('class','friendFormChildElement');
        tmpFriendFormChild.insertBefore(losses,null);
        var lossesInpParent = document.createElement("div");
        lossesInpParent.setAttribute('class','friendFormChildElement');
        var lossesInp = document.createElement("input");
        lossesInp.setAttribute("class","digits4");
        lossesInp.setAttribute("maxlength","4");
        lossesInp.setAttribute("data-friendIdx",i.toString(10));
        lossesInp.value = pd.players[playerIdx].friends[i].getLosses().toString(10);
        lossesInp.addEventListener('change',(event) => {
            var friendIdx = Number(event.target.getAttribute("data-friendIdx"));
            var tmp = ston(event.target.value);
            if(tmp > -1 && tmp < 10000){
                pd.players[playerIdx].friends[friendIdx].setLosses(tmp);
            }
            event.target.value = pd.players[playerIdx].friends[friendIdx].getLosses().toString(10);
        });
        lossesInpParent.insertBefore(lossesInp,null);
        tmpFriendFormChild.insertBefore(lossesInpParent,null);
        var div1 = document.createElement("div");
        div1.style.flex = 1;
        tmpFriendFormChild.insertBefore(div1,null);
        var saveMiiBtnParent = document.createElement("div");
        saveMiiBtnParent.setAttribute('class','friendFormChildElement');
        var saveMiiBtn = document.createElement("button");
        saveMiiBtn.innerHTML = 'save Mii';
        saveMiiBtn.setAttribute("data-friendIdx",i.toString(10));
        saveMiiBtn.addEventListener('click',(event) => {
            var friendIdx = Number(event.target.getAttribute("data-friendIdx"));
            var fileName = getFileName(pd.players[playerIdx].friends[friendIdx].getName()) + ".miigx";
            fileSave(pd.players[playerIdx].friends[friendIdx].getMii(),fileName);
        });
        saveMiiBtnParent.insertBefore(saveMiiBtn,null);
        tmpFriendFormChild.insertBefore(saveMiiBtnParent,null);
        friendForm.insertBefore(tmpFriendFormChild,null);
    }
    mainForm.style.display = 'none';
    friendForm.style.display = 'block';
}

function friendFormClose(){
    friendForm.style.display = 'none';
    mainForm.style.display = 'block';
}