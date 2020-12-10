window.onload = () => {
  let firebaseConfig = {
    apiKey: "AIzaSyDFM59u1Ow4njv-htWIIG2MUTHmXtlilr8",
    authDomain: "misiyevich-testing.firebaseapp.com",
    databaseURL: "https://misiyevich-testing.firebaseio.com",
    projectId: "misiyevich-testing",
    storageBucket: "misiyevich-testing.appspot.com",
    messagingSenderId: "33702212350",
    appId: "1:33702212350:web:4ed1ee0f80e04f86c2abaf",
    measurementId: "G-E54JH258W0"
  };
  let email;
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  let provider = new firebase.auth.GoogleAuthProvider();

  //SIGN OUT
  document.getElementById('logout').addEventListener('click',()=>{
    //firebase.auth().signOut();
    signOut().then(()=>{
      document.querySelector('div.login').style.display = 'block';
      document.getElementById('main').style.display = 'none';
    });

  });
  function signOut(){
    firebase.auth().signOut()
        .then(function() {
          document.location.reload();
          console.log('Signout Succesfull')
        })
  }


  //LOGIN
  document.getElementById('login').addEventListener('click',(e)=>{
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    //provider.setCustomParameters({ prompt: 'select_account' });
    firebase.auth().signInWithRedirect(provider);
    //firebase.auth();
  });

  firebase.auth().getRedirectResult().then(function(result) {
    //if my own db
    email = result.additionalUserInfo.profile.email.replace(/[\s.,#$]/g, '');
    document.querySelector('.db').innerHTML = email;

    //check if fields exist
    firebase.database().ref('users/' + email + '/permissions').once('value', function (snapshot){
      if(!snapshot.val()){
        firebase.database().ref('users/' + email + '/permissions').set({
          emails: '',
          type: 'permissions'
        })
      }
    });
    firebase.database().ref('users/' + email + '/requests').once('value', function (snapshot){
      if(!snapshot.val()){
        firebase.database().ref('users/' + email + '/requests').set({
          emails: '',
          type: 'requests'
        })
      }
    });
    //check if some requests

    //add new account
    async function addAccount(){
      let userName = document.getElementById('name').value;
      //request to instagram
      let response = await fetch('https://www.instagram.com/' + userName + '/?__a=1');
      let info = await response.json();
      if(info.graphql){
        firebase.database().ref('users/' + email + '/accounts/' + userName).set({
          name: userName,
          avatar_url: info.graphql.user.profile_pic_url_hd,
          followers: info.graphql.user.edge_followed_by,
          link: 'https://www.instagram.com/' + userName,
        });
      }
      else{
        document.querySelector('div.alert').classList.remove('delete');
        setTimeout(()=>{
          document.querySelector('div.alert').classList.add('delete');
        }, 2000)
      }
    }
    function deleting(name, node){
      let nameToDelete = firebase.database().ref('users/'+email +'/accounts/'+ name);
      nameToDelete.remove()
          .then(function() {
            node.remove();
            if(!document.getElementById('accounts').innerHTML){
              document.getElementById('accounts').innerHTML= 'There are no accounts in the list';
            }
            //getData();          //optimize that!
          })
          .catch(function(error) {
            console.log("Remove failed: " + error.message)
          });
    }
    function getData(){
      firebase.database().ref('/users/' + email + '/accounts').once('value', function (snapshot){
        //if not empty db
        if(snapshot.val()){
          snapshot.forEach(childsnapshot => {
            //exclude permissions data for execution
            if(childsnapshot.val().type !== 'permissions' && childsnapshot.val().type !== 'requests'){
              let childkey = childsnapshot.key;
              let childdata = childsnapshot.val();


              let acc = document.createElement("div");
              acc.className = 'account';

              let img = document.createElement('img');
              img.src = childdata.avatar_url;
              acc.appendChild(img);

              let div = document.createElement('div');
              div.className = 'info';


              let name = document.createElement('a');
              name.innerHTML = childdata.name;
              name.href = childdata.link;
              div.appendChild(name);

              let followers = document.createElement('p');
              followers.innerHTML = childdata.followers.count;
              div.appendChild(followers);

              let deleteBtn = document.createElement('button');
              deleteBtn.className = 'deleteBtn';
              deleteBtn.addEventListener('click', (e) => {
                e.target.parentNode.parentNode.classList.add('deleting');
                //for animate
                setTimeout(()=>deleting(e.target.parentNode.childNodes[0].innerHTML, e.target.parentNode.parentNode ),1000)
              });
              div.appendChild(deleteBtn);

              acc.appendChild(div);
              document.getElementById('accounts').appendChild(acc);
            }
          });

          if(!document.getElementById('accounts').innerHTML){
            document.getElementById('accounts').innerHTML= 'There are no accounts in the list';
          }
        }
        else{
          document.getElementById('accounts').innerHTML= 'There are no accounts in the list';
        }
        //map each user in db

      });
    }
    function connection(){
      let emailToConnect = document.querySelector('#connectName')
          .value.replace(/[\s.,#$]/g, '');
      //check if user to connect exists
      firebase.database().ref('users/' + emailToConnect).once('value', function (snapshot){
        //if exists
        if(snapshot.val()){
          //check if allowed to connect
          firebase.database().ref('users/' + emailToConnect + '/permissions/emails').once('value', function (snapshot){
            //if allowed
            if(snapshot.val().split(',').includes(email)){
              email = emailToConnect;
              document.querySelector('.db').innerHTML = email;
              document.getElementById('connectName').value = '';
              document.getElementById('accounts').innerHTML= '';
              getData();
            }
            //if not allowed check in requests
            else{
              //check in requests
              firebase.database().ref('users/' + emailToConnect + '/requests/emails').once('value', function (snapshot){
                //if not in requests add new email to requests else do nothing
                if(!snapshot.val().split(',').includes(email)){
                  let newEmails = '';
                  let temp = snapshot.val() ? snapshot.val().split(',') : [];
                  temp.push(email);
                  newEmails = temp.join();
                  firebase.database().ref('users/' + emailToConnect + '/requests').update({'emails': newEmails});
                  document.getElementById('connectName').value = 'Requested to the user';
                  document.getElementById('connectName').style.backgroundColor = '#fdb38a66';
                  setTimeout(()=>{
                    document.getElementById('connectName').style.backgroundColor = '#cfcfcf66';
                    document.getElementById('connectName').value = '';
                  },2000)
                }
                else{
                  document.getElementById('connectName').value = 'User has not applied you yet ';
                  document.getElementById('connectName').style.backgroundColor = '#fdb38a66';
                  setTimeout(()=>{
                    document.getElementById('connectName').style.backgroundColor = '#cfcfcf66';
                    document.getElementById('connectName').value = '';
                  },2000)
                }
              })
            }
          });
        }
        else{
          document.getElementById('connectName').value = 'Incorrect';
          document.getElementById('connectName').style.backgroundColor = 'rgb(158 40 42 / .5)';
          setTimeout(()=>{
            document.getElementById('connectName').style.backgroundColor = '#cfcfcf';
            document.getElementById('connectName').value = '';
          },2000)
        }
      });
    }
    function disconnection(){
      document.getElementById('accounts').innerHTML= '';
      //delete disallowed symbols and apply email to connetc to email var
      email = result.additionalUserInfo.profile.email.replace(/[\s.,#$]/g, '');
      document.querySelector('.db').innerHTML = email;
      document.getElementById('connectName').value = '';
      getData();
    }
    (function checkRequests() {
      //if requests exist show popup
      firebase.database().ref('users/' + email + '/requests/emails').once('value', function (snapshot){
        if(snapshot.val()){
          let popup = document.querySelector('div.popupRequest');
          let requests = snapshot.val().split(',');
          function newReqNode(name){
            let wrap = document.createElement('div');
            let buts = document.createElement('div');
            buts.className = 'buts';
            let buttonApply = document.createElement('button');
            buttonApply.innerHTML = 'Apply';
            buttonApply.classList.add('button');
            let buttonDecline = document.createElement('button');
            buttonDecline.innerHTML = 'Decline';
            buttonDecline.classList.add('button');
            buts.appendChild(buttonApply);
            buts.appendChild(buttonDecline);
            let requestName = document.createElement('p');
            requestName.innerHTML = name;
            buttonDecline.addEventListener('click', (e)=>{
              requests = requests.filter(name => name !== e.target.parentNode.parentNode.querySelector('p').innerHTML);
              firebase.database().ref('users/' + email + '/requests').update(
                  {'emails': requests.join()}
              );
              e.target.parentNode.parentNode.remove();
              //close if empty list
              if(!requests.join()){
                document.querySelector('div.close').click();
              }
            });
            buttonApply.addEventListener('click', (e)=>{
              requests = requests.filter(name => name !== e.target.parentNode.parentNode.querySelector('p').innerHTML);
              firebase.database().ref('users/' + email + '/requests').update(
                  {'emails': requests.join()}
              );
              firebase.database().ref('users/' + email + '/permissions/emails').once('value', function (snapshot){
                let perm = snapshot.val()?snapshot.val().split(','):[];
                perm.push(e.target.parentNode.parentNode.querySelector('p').innerHTML);
                firebase.database().ref('users/' + email + '/permissions').update(
                    {'emails': perm.join()}
                );
              });
              e.target.parentNode.parentNode.remove();
              //close if empty list
              if(!requests.join()){
                document.querySelector('div.close').click();
              }
            });
            wrap.appendChild(requestName);
            wrap.appendChild(buts);
            document.querySelector('div.list').appendChild(wrap);
          }
          requests.forEach(req =>{
            newReqNode(req)
          });

          popup.style.display = 'block'
        }
      })
    })();
    document.getElementById('connectBtn').addEventListener("click", (e)=>{
      connection(e);
    });
    document.getElementById('disconnectBtn').addEventListener("click", (e)=>{
      disconnection();
    });
    document.getElementById('btn').addEventListener('click',()=>{
      addAccount().then(r =>{
        document.getElementById('accounts').innerHTML = '';
        getData();
        document.getElementById('name').value = '';
      });
    });
    document.getElementById('name').addEventListener("keydown", function(event) {
      if (event.key === 'Enter') {
        document.getElementById('btn').click();
      }
    });
    document.getElementById('connectName').addEventListener("keydown", function(event) {
      if (event.key === 'Enter') {
        document.getElementById('connectBtn').click();
      }
    });
    getData();
  }).then(()=>{
    document.querySelector('.login').style.display = 'none';
    document.getElementById('main').style.display = 'grid';
  });

  //other handlers
  document.querySelector('div.close').addEventListener('click',()=>{
    document.querySelector('div.popupRequest').style.display = 'none'
  })
};