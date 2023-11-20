var link=`https://www.google.com`;
const msg = encodeURIComponent('Hey, I found this article');
const title = encodeURIComponent('Article or Post Title Here');

const fb = document.querySelector('.facebook');

const twitter = document.querySelector('.twitter');

const linkedIn = document.querySelector('.linkedin');

const reddit = document.querySelector('.reddit');

const whatsapp = document.querySelector('.whatsapp');

const telegram = document.querySelector('.telegram');

socket.on('shareSocials',(data)=>{
    link=data;
    console.log(data);
    fb.href = `https://www.facebook.com/share.php?u=${link}`;
    linkedIn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${link}`;
    telegram.href = `https://telegram.me/share/url?url=${link}&text=${msg}`;
    whatsapp.href = `https://api.whatsapp.com/send?text=${msg}: ${link}`;
    reddit.href = `http://www.reddit.com/submit?url=${link}&title=${title}`;
    twitter.href = `http://twitter.com/share?&url=${link}&text=${msg}&hashtags=javascript,programming`;

})