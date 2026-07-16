(function() {
    'use strict';
    const left = document.createElement('aside');
    left.id = 'brand';
    left.innerHTML = 
    `
    <div class="brand-top">
        <img src="https://www.rangitoto.school.nz/app/uploads/2021/05/logo-dark-mobile.png" class="brand-logo">
        <span>Rangitoto College</span>
    </div>
    <div class="brand-mid">
        <span class="kicker">Student Portal</span>
        <h1>Great Opportunities.<br>Great Students.</h1>
    </div>
    <div class="brand-foot">
        <a href="https://www.rangitoto.school.nz/">School Website</a>
        <a href="https://www.rangitoto.school.nz/parents-students/communications/daily-notices/">Daily Notices</a>
        <a href="https://sites.google.com/a/cloud.rangitoto.school.nz/ranginet-home">RangiNet</a>
    </div>
    `;
    const login_form = document.querySelector('#login');
    const right = document.createElement('aside');
    right.id = 'form';

    login_form.replaceWith(right);

    document.body.appendChild(left);
    right.appendChild(login_form);


    // move the logo into the sub area 
    const logo = document.querySelector('#logo');
    const sub_area = document.querySelector('form');

    const title_area = document.createElement('div');
    title_area.id = 'title-area';

    // add a title beside the logo 
    const title = document.createElement('h1');
    title.textContent = 'Rangitoto College';
    title.id = 'title';
    // add a subtitle below the logo
    const subtitle = document.createElement('p');
    subtitle.textContent = 'STUDENT PORTAL';
    subtitle.id = 'subtitle';

    sub_area.prepend(logo);
    logo.appendChild(title_area);
    title_area.prepend(subtitle);
    title_area.prepend(title);
})();