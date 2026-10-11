/* Écran de fin : spectacle 2D en boucle (12 s).
 *   1. Course : le Père Noël fait des allers-retours en trottinette, deux
 *      lutins accrochés derrière lui (jambes au vent).
 *   2. Fête : ils s'arrêtent et se lâchent (twerk et danse).
 * Le Père Noël porte des lunettes de soleil en étoile ; tout le monde est
 * habillé aux couleurs du site (rouge, blanc, bleus). Deux bulles de
 * dialogue s'affichent pendant la fête (config/quetes.js → traque.finBulles).
 * Animations : css/styles.css (section « Spectacle de fin »). */
(function () {
  'use strict';

  var GQ = window.GQ;
  var esc = GQ.esc;

  function star(cx, cy, R, r) {
    var p = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + (i * Math.PI) / 5;
      var d = i % 2 ? r : R;
      p.push((cx + d * Math.cos(a)).toFixed(1) + ',' + (cy + d * Math.sin(a)).toFixed(1));
    }
    return p.join(' ');
  }

  /* Un lutin, pieds en (0, 0), tourné vers la droite, mains tendues en
   * (17, -46). */
  var ELF =
    '<rect x="-11" y="-5" width="10" height="5" rx="2.5" fill="#0b1d45"/><rect x="2" y="-5" width="10" height="5" rx="2.5" fill="#0b1d45"/>' +
    '<rect x="-8" y="-24" width="6" height="20" fill="url(#f-stripes)"/><rect x="2" y="-24" width="6" height="20" fill="url(#f-stripes)"/>' +
    '<path d="M-12 -22L-9 -45H9L12 -22Z" fill="#17428c"/><rect x="-11" y="-31" width="22" height="3" fill="#fff"/>' +
    '<path d="M5 -41L17 -46" stroke="#17428c" stroke-width="5" stroke-linecap="round"/><circle cx="17.5" cy="-46" r="2.6" fill="#fff"/>' +
    '<path d="M-9 -56l-7 -5 5 9zM9 -56l7 -5 -5 9z" fill="#dbe6f4"/>' +
    '<circle cx="0" cy="-54" r="9" fill="#dbe6f4"/>' +
    '<circle cx="-3" cy="-55" r="1.3" fill="#0b1d45"/><circle cx="3.5" cy="-55" r="1.3" fill="#0b1d45"/>' +
    '<path d="M-3 -50.5Q0.5 -48 4 -50.5" stroke="#0b1d45" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
    '<circle cx="-5" cy="-51.5" r="1.6" fill="#e4323a" opacity=".45"/><circle cx="6" cy="-51.5" r="1.6" fill="#e4323a" opacity=".45"/>' +
    '<path d="M-10 -59Q-2 -84 17 -78L10 -61Z" fill="#00ade1"/><circle cx="17" cy="-78" r="3.2" fill="#e4323a"/>' +
    '<rect x="-10.5" y="-62" width="21" height="4.5" rx="2.2" fill="#fff"/>';

  /* Le Père Noël (pieds sur la trottinette, face à droite). */
  var SANTA =
    '<rect x="166" y="174" width="11" height="16" rx="3" fill="#0b1d45"/><rect x="182" y="174" width="11" height="16" rx="3" fill="#0b1d45"/>' +
    '<rect x="167" y="160" width="9" height="16" fill="#e4323a"/><rect x="183" y="160" width="9" height="16" fill="#e4323a"/>' +
    '<path d="M163 128Q150 138 156 150" stroke="#e4323a" stroke-width="10" stroke-linecap="round" fill="none"/>' +
    '<rect x="158" y="114" width="42" height="52" rx="16" fill="#e4323a"/>' +
    '<rect x="176" y="117" width="6" height="44" fill="#fff"/>' +
    '<rect x="157" y="158" width="44" height="9" rx="4.5" fill="#fff"/>' +
    '<rect x="158" y="142" width="42" height="7" fill="#0b1d45"/><rect x="174" y="140.5" width="10" height="10" rx="1.5" fill="none" stroke="#00ade1" stroke-width="2"/>' +
    '<path d="M195 124Q210 121 217 127" stroke="#e4323a" stroke-width="10" stroke-linecap="round" fill="none"/><circle cx="218" cy="127" r="5" fill="#fff"/>' +
    '<path d="M163 99Q163 131 179 133Q195 131 195 99Z" fill="#fff"/>' +
    '<circle cx="179" cy="97" r="13" fill="#dbe6f4"/>' +
    '<circle cx="171" cy="103" r="3" fill="#e4323a" opacity=".35"/><circle cx="188" cy="103" r="3" fill="#e4323a" opacity=".35"/>' +
    '<path d="M168 107Q179 101 190 107Q184 112 179 108Q174 112 168 107Z" fill="#fff"/>' +
    '<circle cx="179" cy="103" r="3.2" fill="#e4323a"/>' +
    // Lunettes de soleil en étoile.
    '<polygon points="' + star(172.5, 95, 6.5, 2.8) + '" fill="#0b1d45" stroke="#00ade1" stroke-width="1.2" stroke-linejoin="round"/>' +
    '<polygon points="' + star(186, 95, 6.5, 2.8) + '" fill="#0b1d45" stroke="#00ade1" stroke-width="1.2" stroke-linejoin="round"/>' +
    '<path d="M177 94.5H181.5" stroke="#00ade1" stroke-width="1.5"/>' +
    '<path d="M164 88Q177 60 200 69Q206 73 205 81L194 88Z" fill="#e4323a"/>' +
    '<rect x="162" y="84" width="35" height="8.5" rx="4.2" fill="#fff"/><circle cx="206" cy="80" r="5.5" fill="#fff"/>';

  var SCOOTER =
    '<rect x="138" y="189" width="86" height="6" rx="3" fill="#17428c"/>' +
    '<path d="M218 189L223 126" stroke="#00ade1" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M213 124H233" stroke="#00ade1" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="146" cy="200" r="8" fill="#0b1d45"/><circle cx="146" cy="200" r="3" fill="#fff"/>' +
    '<circle cx="220" cy="200" r="8" fill="#0b1d45"/><circle cx="220" cy="200" r="3" fill="#fff"/>';

  GQ.finShow = function () {
    var B = (GQ.cfg.quetes.traque || {}).finBulles || [];
    var flakes = '';
    for (var i = 0; i < 18; i++) {
      flakes += '<circle cx="' + ((i * 47) % 360) + '" cy="' + ((i * 29) % 150) + '" r="' + (i % 3 ? 1.4 : 2.2) + '" fill="#fff" opacity=".7" class="f-flake" style="animation-delay:-' + (i * 0.7).toFixed(1) + 's"/>';
    }
    return (
      '<div class="fin-show" aria-hidden="true">' +
      '<svg class="fin-svg" viewBox="0 0 360 230">' +
      '<defs><pattern id="f-stripes" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="3" fill="#e4323a"/><rect y="3" width="6" height="3" fill="#fff"/></pattern></defs>' +
      // Projecteurs de la fête.
      '<g class="f-lights"><path d="M40 0L-10 206H110Z" fill="#e4323a"/><path d="M320 0L250 206H370Z" fill="#00ade1"/><path d="M180 0L130 206H230Z" fill="#fff" opacity=".5"/></g>' +
      flakes +
      '<rect x="0" y="206" width="360" height="24" fill="#17428c"/><path d="M0 206H360" stroke="#fff" stroke-width="3"/>' +
      '<g class="f-rig">' +
      SCOOTER +
      '<g class="f-pos f-pos2"><g class="f-hang f-hang2"><g class="f-twerk f-twerk2"><g transform="translate(133 196) scale(.9)">' + ELF + '</g></g></g></g>' +
      '<g class="f-pos f-pos1"><g class="f-hang f-hang1"><g class="f-twerk f-twerk1"><g transform="translate(141 174)">' + ELF + '</g></g></g></g>' +
      '<g class="f-santa">' + SANTA + '</g>' +
      '</g>' +
      '</svg>' +
      (B[0] ? '<p class="fin-bubble fin-bubble-1"><b>' + esc(B[0].qui || '') + '</b>' + GQ.t(B[0].texte) + '</p>' : '') +
      (B[1] ? '<p class="fin-bubble fin-bubble-2"><b>' + esc(B[1].qui || '') + '</b>' + GQ.t(B[1].texte) + '</p>' : '') +
      '</div>'
    );
  };
})();
