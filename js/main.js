(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // loader
  window.addEventListener('load', function(){
    setTimeout(function(){ document.getElementById('loader').classList.add('hide'); }, 700);
  });

  // flight arc: jump to the end state for reduced motion
  var flight = document.getElementById('flight');
  if (reduce && flight && flight.setCurrentTime) { flight.setCurrentTime(10); }

  // header, progress bar, back-to-top
  var header = document.getElementById('site-header');
  var progress = document.getElementById('progress');
  var toTop = document.getElementById('toTop');
  function onScroll(){
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', y > 40);
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    toTop.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
  toTop.addEventListener('click', function(){ window.scrollTo({top:0, behavior: reduce ? 'auto' : 'smooth'}); });

  // mobile nav
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  function setNav(open){
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.textContent = open ? '✕' : '☰';
  }
  toggle.addEventListener('click', function(){ setNav(!nav.classList.contains('open')); });
  nav.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setNav(false); }); });

  // reveal on scroll
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:0.12});
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  // counters
  var cio = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting) return;
      var el = e.target, target = +el.dataset.count, suffix = el.dataset.suffix || '';
      if (reduce){ el.textContent = target + suffix; cio.unobserve(el); return; }
      var start = null;
      function step(ts){
        if (!start) start = ts;
        var p = Math.min((ts - start) / 1400, 1);
        el.textContent = Math.floor(p * target) + suffix;
        if (p < 1) requestAnimationFrame(step); else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
      cio.unobserve(el);
    });
  }, {threshold:0.5});
  document.querySelectorAll('[data-count]').forEach(function(el){ cio.observe(el); });

  // product filter
  var tabs = document.querySelectorAll('.menu-tab');
  var products = document.querySelectorAll('#productGrid .product');
  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      tabs.forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      var f = tab.dataset.filter;
      products.forEach(function(p){ p.classList.toggle('hide', f !== 'all' && p.dataset.cat !== f); });
    });
  });

  // active nav link
  var links = document.querySelectorAll('.navlink');
  var sections = Array.prototype.map.call(links, function(a){ return document.querySelector(a.getAttribute('href')); });
  var sio = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting){
        links.forEach(function(a){ a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
      }
    });
  }, {rootMargin:'-45% 0px -50% 0px'});
  sections.forEach(function(s){ if (s) sio.observe(s); });

  // quote form -> Google Form
  // Fill these in (see the steps in the chat). While `action` is empty the form falls back to opening the visitor's email app.
  var GOOGLE_FORM = {
    action: '',            // e.g. 'https://docs.google.com/forms/d/e/XXXXXXXX/formResponse'
    fields: {
      name:    '',         // e.g. 'entry.1234567890'
      company: '',
      email:   '',
      country: '',
      product: '',
      qty:     '',
      message: ''
    }
  };
  var TO_EMAIL = 'originlankaexports@gmail.com';

  var form = document.getElementById('quoteForm');
  var note = document.getElementById('formNote');
  var btn = form.querySelector('button[type="submit"]');
  function val(id){ return document.getElementById(id).value.trim(); }

  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    var data = {
      name: val('fName'), company: val('fCompany'), email: val('fEmail'),
      country: val('fCountry'), product: val('fProduct'), qty: val('fQty'), message: val('fMsg')
    };
    var f = GOOGLE_FORM.fields;
    var ready = GOOGLE_FORM.action && Object.keys(f).every(function(k){ return f[k]; });

    if (ready){
      var body = new FormData();
      Object.keys(f).forEach(function(k){ body.append(f[k], data[k]); });
      btn.disabled = true; btn.textContent = 'Sending...';
      note.classList.remove('show');
      fetch(GOOGLE_FORM.action, {method:'POST', mode:'no-cors', body: body})
        .then(function(){
          form.reset();
          note.textContent = 'Thank you. Your enquiry has been sent and we will get back to you soon.';
          note.classList.add('show');
        })
        .catch(function(){
          note.textContent = 'Sorry, the enquiry could not be sent. Please email us at ' + TO_EMAIL + '.';
          note.classList.add('show');
        })
        .then(function(){ btn.disabled = false; btn.textContent = 'Send enquiry'; });
      return;
    }

    // fallback: open the visitor's email app with the enquiry filled in
    var text = [
      'Name: ' + data.name, 'Company: ' + data.company, 'Email: ' + data.email,
      'Country: ' + data.country, 'Product: ' + data.product,
      'Estimated quantity: ' + data.qty, '', data.message
    ].join('\n');
    var subject = 'Quote request: ' + data.product + ' (' + data.country + ')';
    note.textContent = 'Your email app is opening with the enquiry ready to send.';
    note.classList.add('show');
    window.location.href = 'mailto:' + TO_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
  });
})();
