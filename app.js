
(() => {
  'use strict';

  const $ = s => document.querySelector(s);

  const fmt = (n, d = 2) =>
    new Intl.NumberFormat('es-ES', {
      maximumFractionDigits: d
    }).format(n);

  const euro = n =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(n);

  const n = id => {
    const e = document.getElementById(id);
    if (!e) return NaN;
    const v = e.value.trim().replace(',', '.');
    return v === '' ? NaN : Number(v);
  };

  const s = id => document.getElementById(id)?.value;
  const valid = (...xs) => xs.every(x => Number.isFinite(x));
  const day = 86400000;

  const date = id => {
    const v = s(id);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return null;

    const [y, m, d] = v.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));

    return (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === m - 1 &&
      dt.getUTCDate() === d
    ) ? dt : null;
  };

  function calc(t) {
    let out = '';
    let detail = '';

    const a = n('a');
    const b = n('b');
    const c = n('c');

    switch (t) {

      case 'porcentajes':
        if (!valid(a, b) || b === 0)
          throw Error('Introduce dos números y un total distinto de cero.');

        out = fmt(a / b * 100) + ' %';
        detail = fmt(a) + ' ÷ ' + fmt(b) + ' × 100';
        break;

      case 'descuentos':
        if (!valid(a, b) || a < 0 || b < 0 || b > 100)
          throw Error('El precio debe ser positivo y el descuento entre 0 y 100 %.');

        out = euro(a * (1 - b / 100));
        detail = 'Ahorras ' + euro(a * b / 100);
        break;

      case 'iva':
        if (!valid(a, b) || a < 0 || b < 0 || b > 100)
          throw Error('Introduce un precio válido y un IVA entre 0 y 100 %.');

        if (s('mode') === 'extraer') {
          out = euro(a / (1 + b / 100));
          detail = 'IVA incluido: ' + euro(a - a / (1 + b / 100));
        } else {
          out = euro(a * (1 + b / 100));
          detail = 'IVA añadido: ' + euro(a * b / 100);
        }
        break;

      case 'regla-de-tres':
        if (!valid(a, b, c) || a === 0)
          throw Error('Introduce tres números y un primer valor distinto de cero.');

        out = fmt(b * c / a, 6);
        detail = `Si ${fmt(a)} corresponde a ${fmt(b)}, ${fmt(c)} corresponde a ${out}.`;
        break;

      case 'interes-compuesto': {
        const m = n('m');

        if (
          !valid(a, b, c, m) ||
          a < 0 || b < 0 || b > 100 ||
          c < 0 || c > 100 ||
          m < 0 || m > 1200
        ) {
          throw Error('Revisa el capital, interés, años y aportación mensual.');
        }

        const months = Math.round(c * 12);
        const r = b / 1200;
        let total = a;

        for (let i = 0; i < months; i++) {
          total = total * (1 + r) + m;
        }

        out = euro(total);
        detail =
          'Capital aportado: ' + euro(a + m * months) +
          ' · Rendimiento estimado: ' + euro(total - a - m * months) +
          '. Simulación sin impuestos, comisiones ni inflación.';
        break;
      }

      case 'edad': {
        const birth = date('birth');
        const today = date('today');

        if (!birth || !today || birth > today)
          throw Error('Introduce fechas válidas; el nacimiento no puede ser posterior a la fecha de cálculo.');

        let y = today.getUTCFullYear() - birth.getUTCFullYear();
        let mo = today.getUTCMonth() - birth.getUTCMonth();
        let d = today.getUTCDate() - birth.getUTCDate();

        if (d < 0) {
          mo--;
          d += new Date(
            Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0)
          ).getUTCDate();
        }

        if (mo < 0) {
          y--;
          mo += 12;
        }

        out = `${y} años, ${mo} meses y ${d} días`;
        detail = 'Días totales transcurridos: ' +
          fmt(Math.round((today - birth) / day), 0);
        break;
      }

      case 'imc': {
        if (!valid(a, b) || a <= 0 || b <= 0)
          throw Error('Introduce un peso y una altura mayores que cero.');

        const imc = a / ((b / 100) ** 2);
        out = fmt(imc);

        detail = imc < 18.5
          ? 'Bajo peso orientativo'
          : imc < 25
          ? 'Intervalo habitual orientativo'
          : imc < 30
          ? 'Sobrepeso orientativo'
          : 'Obesidad orientativa';

        detail += '; el IMC no diagnostica el estado de salud ni se interpreta igual en menores o embarazo.';
        break;
      }

      case 'propinas':
        if (
          !valid(a, b, c) ||
          a < 0 || b < 0 || b > 100 ||
          !Number.isInteger(c) || c < 1
        ) {
          throw Error('Introduce cuenta positiva, porcentaje entre 0 y 100 y número entero de personas mayor que cero.');
        }

        out = euro(a * (1 + b / 100) / c) + ' por persona';
        detail = 'Propina total: ' + euro(a * b / 100) +
          ' · Total: ' + euro(a * (1 + b / 100));
        break;

      case 'longitud': {
        const f = {
          m: 1,
          km: 1000,
          cm: 0.01,
          mi: 1609.344,
          ft: 0.3048
        };

        if (!valid(a))
          throw Error('Introduce una cantidad válida.');

        out = fmt(a * f[s('from')] / f[s('to')], 8) + ' ' + s('to');
        detail = 'Conversión mediante factores de longitud estándar.';
        break;
      }

      case 'temperatura': {
        if (!valid(a) || (s('from') === 'K' && a < 0))
          throw Error('Introduce una temperatura válida (Kelvin no puede ser negativo).');

        const k = s('from') === 'C'
          ? a + 273.15
          : s('from') === 'F'
          ? (a + 459.67) * 5 / 9
          : a;

        if (k < 0)
          throw Error('La temperatura está por debajo del cero absoluto.');

        const v = s('to') === 'C'
          ? k - 273.15
          : s('to') === 'F'
          ? k * 9 / 5 - 459.67
          : k;

        out = fmt(v, 4) + ' °' + s('to');

        if (s('to') === 'K')
          out = fmt(v, 4) + ' K';

        detail = 'Conversión usando Kelvin como escala intermedia.';
        break;
      }

      case 'dias-entre-fechas': {
        const d1 = date('start');
        const d2 = date('end');

        if (!d1 || !d2)
          throw Error('Introduce dos fechas válidas.');

        const days = Math.round((d2 - d1) / day);

        out = fmt(Math.abs(days), 0) + ' días';
        detail = days < 0
          ? 'La segunda fecha es anterior a la primera.'
          : 'Diferencia sin contar ambos extremos como días completos.';
        break;
      }

      case 'precio-unitario': {
        const d = n('d');

        if (
          !valid(a, b, c, d) ||
          a < 0 || c < 0 || b <= 0 || d <= 0
        ) {
          throw Error('Introduce precios no negativos y cantidades mayores que cero.');
        }

        const x = a / b;
        const y = c / d;

        out = x === y
          ? 'Ambos tienen el mismo precio por unidad'
          : x < y
          ? 'Producto A es más económico'
          : 'Producto B es más económico';

        detail =
          'A: ' + euro(x) + '/unidad · B: ' +
          euro(y) + '/unidad. Usa la misma unidad de medida para ambos.';
        break;
      }

      default:
        throw Error('Herramienta no disponible.');
    }

    return [out, detail];
  }

  document.addEventListener('DOMContentLoaded', () => {
    const menu = $('#menu');
    const links = $('#navlinks');

    menu?.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
    });

    try {
      if (localStorage.getItem('cf-theme') === 'dark')
        document.body.classList.add('dark');
    } catch (e) {}

    $('#theme')?.addEventListener('click', () => {
      document.body.classList.toggle('dark');

      try {
        localStorage.setItem(
          'cf-theme',
          document.body.classList.contains('dark') ? 'dark' : 'light'
        );
      } catch (e) {}
    });

    const form = $('#calculator');

    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();

        const result = $('#result');

        try {
          const [out, detail] = calc(form.dataset.tool);

          result.innerHTML = '';

          const strong = document.createElement('strong');
          strong.textContent = out;

          const p = document.createElement('p');
          p.textContent = detail;

          result.append(strong, p);
        } catch (err) {
          result.textContent = err.message;
        }
      });

      if ($('#today')) {
        const now = new Date();
        const localDate = new Date(
          now.getTime() - now.getTimezoneOffset() * 60000
        ).toISOString().slice(0, 10);

        $('#today').value = localDate;
      }
    }

    const search = $('#search');
    const cards = [...document.querySelectorAll('[data-card]')];

    let filter = 'Todas';

    const update = () => {
      const q = (search?.value || '').toLocaleLowerCase('es');

      cards.forEach(card => {
        const categoryMatches =
          filter === 'Todas' || card.dataset.category === filter;

        const searchMatches =
          card.textContent.toLocaleLowerCase('es').includes(q);

        card.classList.toggle(
          'hide',
          !categoryMatches || !searchMatches
        );
      });
    };

    search?.addEventListener('input', update);

    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        filter = btn.dataset.filter;

        document.querySelectorAll('[data-filter]').forEach(x => {
          x.setAttribute('aria-pressed', String(x === btn));
        });

        update();
      });
    });
  });
})();
