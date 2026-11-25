(() => {
  'use strict';

  const INITIAL_STATE = {
    activeAdmin: 'Елена (смена 1)',
    activeTab: 'tab-schedule',
    searchQuery: '',
    completedSteps: { s1: false, s2: false, s3: false },
    clients: [
      {
        id: 'c1',
        child: 'Миша Соколов (1.5 года)',
        parent: 'Елена Соколова',
        phone: '+7 900 000-11-01',
        maxLinked: true,
        remaining: 5,
        total: 8,
        medCertDate: '15.01.2027',
        medStatus: 'ok'
      },
      {
        id: 'c2',
        child: 'Маша Орлова (8 мес)',
        parent: 'Ольга Орлова',
        phone: '+7 900 000-22-02',
        maxLinked: true,
        remaining: 1,
        total: 8,
        medCertDate: '02.12.2026',
        medStatus: 'warn'
      },
      {
        id: 'c3',
        child: 'Вася Смирнов (4 года)',
        parent: 'Наталья Смирнова',
        phone: '+7 900 000-33-03',
        maxLinked: true,
        remaining: 6,
        total: 8,
        medCertDate: '27.11.2026',
        medStatus: 'warn'
      },
      {
        id: 'c4',
        child: 'Кира Лебедева (5 лет)',
        parent: 'Артём Лебедев',
        phone: '+7 900 000-44-04',
        maxLinked: true,
        remaining: 4,
        total: 8,
        medCertDate: '10.02.2027',
        medStatus: 'ok'
      },
      {
        id: 'c5',
        child: 'Тимур Громов (6 лет)',
        parent: 'Дарья Громова',
        phone: '+7 900 000-55-05',
        maxLinked: true,
        remaining: 7,
        total: 12,
        medCertDate: '20.03.2027',
        medStatus: 'ok'
      },
      {
        id: 'c6',
        child: 'Алиса Волкова (3 года)',
        parent: 'Ирина Волкова',
        phone: '+7 900 000-66-06',
        maxLinked: false,
        remaining: 3,
        total: 4,
        medCertDate: '05.01.2027',
        medStatus: 'ok'
      }
    ],
    slots: [
      {
        id: 's1',
        time: '09:30',
        lane: 'Малая чаша',
        trainer: 'Тренер Ирина',
        format: 'Грудничковое (инд.)',
        clientId: 'c1',
        status: 'confirmed'
      },
      {
        id: 's2',
        time: '10:00',
        lane: 'Малая чаша',
        trainer: 'Тренер Ирина',
        format: 'Грудничковое (инд.)',
        clientId: 'c2',
        status: 'scheduled'
      },
      {
        id: 's3',
        time: '11:00',
        lane: 'Дорожка 1',
        trainer: 'Тренер Дмитрий',
        format: 'Мини-группа (3–5 лет)',
        clientId: 'c3',
        status: 'confirmed'
      },
      {
        id: 's4',
        time: '11:00',
        lane: 'Дорожка 1',
        trainer: 'Тренер Дмитрий',
        format: 'Мини-группа (3–5 лет)',
        clientId: 'c4',
        status: 'scheduled'
      },
      {
        id: 's5',
        time: '12:00',
        lane: 'Дорожка 2',
        trainer: 'Тренер Дмитрий',
        format: 'Индивидуальное',
        clientId: 'c5',
        status: 'confirmed'
      },
      {
        id: 's6',
        time: '15:00',
        lane: 'Малая чаша',
        trainer: 'Тренер Ирина',
        format: 'Адаптация 3+',
        clientId: 'c6',
        status: 'scheduled'
      },
      {
        id: 's7',
        time: '16:00',
        lane: 'Дорожка 1',
        trainer: 'Тренер Дмитрий',
        format: 'Свободное окно (Мини-группа)',
        clientId: null,
        status: 'free'
      }
    ],
    pendingActions: [],
    chatMessages: [
      {
        who: 'Бот Family Time',
        kind: 'bot',
        text: 'Вчера в 19:00 отправлено 6 напоминаний родителям. Миша и Тимур уже нажали «Придём ✅».'
      }
    ],
    auditLog: [
      { actor: 'Авторассылка', text: '08:00 — Отправлено утреннее расписание тренерам Ирине и Дмитрию в MAX.' },
      { actor: 'Бот Family Time', text: '08:45 — Елена Соколова подтвердила визит Миши на 09:30 кнопкой «Придём ✅».' }
    ]
  };

  let state = clone(INITIAL_STATE);
  let currentCronMode = null;
  let toastTimer = null;

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function findClient(id) {
    return state.clients.find((c) => c.id === id);
  }

  function addAudit(actor, text) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    state.auditLog.unshift({ actor, text: `${hh}:${mm} — ${text}` });
  }

  function addChat(who, kind, text) {
    state.chatMessages.push({ who, kind, text });
  }

  function showToast(title, text) {
    const toast = document.getElementById('benefit-toast');
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-text').textContent = text;
    toast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 6500);
  }

  function markStepDone(key) {
    if (state.completedSteps[key]) return;
    state.completedSteps[key] = true;
    renderSteps();
  }

  function renderSteps() {
    const map = [
      ['s1', 'step-1', '1'],
      ['s2', 'step-2', '2'],
      ['s3', 'step-3', '3']
    ];
    for (const [key, id, num] of map) {
      const node = document.getElementById(id);
      const done = state.completedSteps[key];
      node.classList.toggle('is-done', done);
      node.querySelector('.step-check').textContent = done ? '✓' : num;
    }
  }

  function statusBadgeInfo(status) {
    switch (status) {
      case 'confirmed':
        return { label: 'Подтверждён в MAX', cls: 'pill-green' };
      case 'attended':
        return { label: 'Пришёл ✓ (списано 1 зан.)', cls: 'pill-green' };
      case 'frozen':
        return { label: 'Заморожено (справка)', cls: 'pill-red' };
      case 'free':
        return { label: 'Свободное окно', cls: 'pill-soft' };
      default:
        return { label: 'Ждёт ответа в MAX', cls: 'pill-amber' };
    }
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderCounters() {
    const wrap = document.getElementById('day-counters');
    wrap.replaceChildren();
    const occupied = state.slots.filter((s) => s.clientId !== null);
    const attended = occupied.filter((s) => s.status === 'attended').length;
    const confirmed = occupied.filter((s) => s.status === 'confirmed').length;
    const frozen = occupied.filter((s) => s.status === 'frozen').length;

    const items = [
      `Записей: ${occupied.length}`,
      `Подтверждено: ${confirmed}`,
      `Пришли: ${attended}`,
      `Заморозок: ${frozen}`
    ];
    for (const label of items) {
      wrap.appendChild(el('span', 'counter-pill', label));
    }
  }

  function renderSchedule() {
    const list = document.getElementById('schedule-list');
    list.replaceChildren();

    for (const slot of state.slots) {
      const card = el('article', 'slot-card');
      if (slot.status === 'attended') card.classList.add('is-attended');
      if (slot.status === 'frozen') card.classList.add('is-frozen');
      if (!slot.clientId) card.classList.add('is-free');

      const timeBox = el('div', 'slot-time', slot.time);
      timeBox.appendChild(el('span', 'slot-lane', slot.lane));

      const main = el('div', 'slot-main');

      if (!slot.clientId) {
        main.appendChild(el('div', 'child-name', 'Свободное окно для записи или переноса'));
        main.appendChild(el('div', 'slot-meta', `${slot.trainer} · ${slot.format}`));
        const badges = el('div', 'badges-row');
        badges.appendChild(el('span', 'pill pill-soft', 'Открыто для переноса'));
        main.appendChild(badges);
        card.append(timeBox, main, el('div', 'slot-actions'));
        list.appendChild(card);
        continue;
      }

      const client = findClient(slot.clientId);
      main.appendChild(el('div', 'child-name', client.child));
      main.appendChild(el('div', 'slot-meta', `${slot.trainer} · ${slot.format} · ${client.parent}`));

      const badges = el('div', 'badges-row');
      const info = statusBadgeInfo(slot.status);
      badges.appendChild(el('span', `pill ${info.cls}`, info.label));

      const remCls = client.remaining <= 1 ? 'pill-amber' : 'pill-soft';
      const remPrefix = client.remaining <= 1 ? '⚠️ ' : '';
      badges.appendChild(el('span', `pill ${remCls}`, `${remPrefix}Остаток: ${client.remaining}/${client.total}`));

      if (client.medStatus === 'warn') {
        badges.appendChild(el('span', 'pill pill-amber', `🩺 Справка до ${client.medCertDate}`));
      } else {
        badges.appendChild(el('span', 'pill pill-soft', `Справка до ${client.medCertDate}`));
      }
      main.appendChild(badges);

      const actions = el('div', 'slot-actions');
      if (slot.status === 'attended') {
        const undoBtn = el('button', 'btn btn-ghost', 'Отменить явку');
        undoBtn.type = 'button';
        undoBtn.addEventListener('click', () => toggleAttendance(slot.id, false));
        actions.appendChild(undoBtn);
      } else if (slot.status !== 'frozen') {
        const attendBtn = el('button', 'btn btn-attend', 'Отметить явку ✓');
        attendBtn.type = 'button';
        attendBtn.addEventListener('click', () => toggleAttendance(slot.id, true));
        actions.appendChild(attendBtn);
      }

      card.append(timeBox, main, actions);
      list.appendChild(card);
    }
  }

  function renderClients() {
    const tbody = document.getElementById('clients-tbody');
    tbody.replaceChildren();
    const q = state.searchQuery.trim().toLowerCase();

    const filtered = state.clients.filter((c) => {
      if (!q) return true;
      return (
        c.child.toLowerCase().includes(q) ||
        c.parent.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      );
    });

    for (const c of filtered) {
      const tr = document.createElement('tr');

      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = c.child;

      const tdParent = document.createElement('td');
      tdParent.textContent = `${c.parent} (${c.phone}) · ${c.maxLinked ? 'MAX подключён' : 'Без MAX'}`;

      const tdSub = document.createElement('td');
      tdSub.appendChild(
        el(
          'span',
          `pill ${c.remaining <= 1 ? 'pill-amber' : 'pill-green'}`,
          `${c.remaining <= 1 ? '⚠️ ' : ''}${c.remaining} из ${c.total} зан.`
        )
      );

      const tdMed = document.createElement('td');
      tdMed.appendChild(
        el('span', `pill ${c.medStatus === 'warn' ? 'pill-amber' : 'pill-soft'}`, `до ${c.medCertDate}`)
      );

      const tdAct = document.createElement('td');
      const addBtn = el('button', 'btn btn-sm', '+8 занятий');
      addBtn.type = 'button';
      addBtn.addEventListener('click', () => renewSubscription(c.id));
      tdAct.appendChild(addBtn);

      tr.append(th, tdParent, tdSub, tdMed, tdAct);
      tbody.appendChild(tr);
    }
  }

  function renderTrainersAndAudit() {
    const grid = document.getElementById('trainers-summary');
    grid.replaceChildren();

    const trainerMap = new Map();
    for (const slot of state.slots) {
      if (!trainerMap.has(slot.trainer)) {
        trainerMap.set(slot.trainer, { total: 0, attended: 0, frozen: 0 });
      }
      const stat = trainerMap.get(slot.trainer);
      if (slot.clientId) stat.total += 1;
      if (slot.status === 'attended') stat.attended += 1;
      if (slot.status === 'frozen') stat.frozen += 1;
    }

    for (const [name, stat] of trainerMap.entries()) {
      const box = el('div', 'trainer-box');
      box.appendChild(el('strong', '', name));
      box.appendChild(
        el(
          'div',
          'trainer-stats',
          `Записано: ${stat.total} · Проведено: ${stat.attended} · Заморозок: ${stat.frozen}`
        )
      );
      grid.appendChild(box);
    }

    const auditUl = document.getElementById('audit-log-list');
    auditUl.replaceChildren();
    for (const item of state.auditLog) {
      const li = document.createElement('li');
      li.append(el('span', 'audit-actor', `[${item.actor}] `), document.createTextNode(item.text));
      auditUl.appendChild(li);
    }
  }

  function renderPending() {
    const list = document.getElementById('pending-list');
    const badge = document.getElementById('pending-count');
    const mobBadge = document.getElementById('mob-pending-badge');
    const count = state.pendingActions.length;

    list.replaceChildren();
    badge.textContent = String(count);
    mobBadge.textContent = String(count);
    mobBadge.hidden = count === 0;

    if (count === 0) {
      list.appendChild(
        el(
          'div',
          'pending-empty',
          'Пока пусто. Нажмите сценарий 2 или 3 ниже в чате MAX — умный помощник подготовит готовый черновик.'
        )
      );
      return;
    }

    for (const action of state.pendingActions) {
      const box = el('article', 'pending-item');
      box.appendChild(el('strong', '', action.title));
      box.appendChild(el('p', '', action.detail));

      const btns = el('div', 'pending-btns');
      const approveBtn = el('button', 'btn btn-primary btn-sm', 'Подтвердить ✓');
      approveBtn.type = 'button';
      approveBtn.addEventListener('click', () => resolvePending(action.id, true));

      const rejectBtn = el('button', 'btn btn-ghost btn-sm', 'Отклонить');
      rejectBtn.type = 'button';
      rejectBtn.addEventListener('click', () => resolvePending(action.id, false));

      btns.append(approveBtn, rejectBtn);
      box.appendChild(btns);
      list.appendChild(box);
    }
  }

  function renderChat() {
    const log = document.getElementById('max-chat-log');
    log.replaceChildren();
    for (const m of state.chatMessages) {
      const msg = el('div', `chat-msg ${m.kind}`);
      msg.appendChild(el('span', 'msg-who', m.who));
      msg.appendChild(document.createTextNode(m.text));
      log.appendChild(msg);
    }
    log.scrollTop = log.scrollHeight;
  }

  function renderAll() {
    document.getElementById('active-admin-label').textContent = state.activeAdmin;
    renderSteps();
    renderCounters();
    renderSchedule();
    renderClients();
    renderTrainersAndAudit();
    renderPending();
    renderChat();
    refreshCronIfOpen();
  }

  function toggleAttendance(slotId, markAttended) {
    const slot = state.slots.find((s) => s.id === slotId);
    if (!slot || !slot.clientId) return;
    const client = findClient(slot.clientId);

    if (markAttended) {
      if (slot.status === 'attended') return;
      if (client.remaining <= 0) {
        addAudit(state.activeAdmin, `Попытка списания для ${client.child}: абонемент закончился, нужно продление.`);
        showToast(
          'Защита от минуса в абонементе',
          `У ${client.child} закончились занятия. Система подсказала продлить абонемент во вкладке «Семьи и справки».`
        );
        renderTrainersAndAudit();
        return;
      }
      slot.prevStatus = slot.status;
      slot.status = 'attended';
      client.remaining -= 1;
      addAudit(
        state.activeAdmin,
        `Отмечена явка: ${client.child} (${slot.time}), списано 1 занятие (осталось ${client.remaining}).`
      );
      if (client.remaining === 1) {
        addChat('Бот Family Time', 'bot', `Авто-напоминание для ${client.parent}: осталось 1 занятие в абонементе.`);
      }
      markStepDone('s1');
      showToast(
        'Явка отмечена за 1 клик!',
        `Списано 1 занятие у ${client.child} (осталось ${client.remaining}). В Excel это занимало ~2 минуты, а повторное списание здесь невозможно.`
      );
    } else {
      if (slot.status !== 'attended') return;
      slot.status = slot.prevStatus || 'confirmed';
      client.remaining += 1;
      addAudit(state.activeAdmin, `Отменена отметка явки для ${client.child}, 1 занятие возвращено.`);
      showToast(
        'Ошибку легко исправить',
        `Отметка снята, 1 занятие вернулось в абонемент. В истории смен сохранилась запись, кто это сделал.`
      );
    }

    renderAll();
  }

  function renewSubscription(clientId) {
    const client = findClient(clientId);
    if (!client) return;
    client.remaining += 8;
    client.total = Math.max(client.total, client.remaining);
    addAudit(state.activeAdmin, `Продлён абонемент (+8 занятий) для ${client.child}.`);
    addChat('Бот Family Time', 'bot', `Отправлено ${client.parent}: абонемент продлён, доступно ${client.remaining} занятий.`);
    showToast(
      'Абонемент продлён и родитель уведомлён',
      `Добавлено +8 занятий для ${client.child}. Родитель сразу получил подтверждение в MAX — меньше вопросов «а вы точно отметили оплату?».`
    );
    renderAll();
  }

  function resolvePending(actionId, approved) {
    const idx = state.pendingActions.findIndex((a) => a.id === actionId);
    if (idx === -1) return;
    const action = state.pendingActions[idx];
    state.pendingActions.splice(idx, 1);

    if (!approved) {
      addAudit(state.activeAdmin, `Отклонён черновик помощника: ${action.title}`);
      showToast(
        'Черновик отклонён — контроль у админа',
        'Расписание и абонемент остались без изменений. Помощник никогда не принимает решения сам.'
      );
      renderAll();
      return;
    }

    if (action.type === 'freeze_vasya') {
      const slot = state.slots.find((s) => s.id === 's3');
      const vasya = findClient('c3');
      if (slot) slot.status = 'frozen';
      if (vasya) {
        vasya.medCertDate = '25.12.2026';
        vasya.medStatus = 'ok';
      }
      addAudit(
        `Помощник + ${state.activeAdmin}`,
        'Заморозка по справке для Васи Смирнова (11:00): занятие не списано, справка обновлена до 25.12.2026.'
      );
      addChat(
        'Бот Family Time',
        'bot',
        'Наталье Смирновой: справка принята, занятие 11:00 заморожено без списания. Выздоравливайте!'
      );
      showToast(
        'Справка и заморозка оформлены за 1 клик!',
        'Расписание обновилось, дата справки продлена до 25.12.2026, а мама Васи уже получила тёплый ответ в MAX.'
      );
    } else if (action.type === 'move_kira') {
      const oldSlot = state.slots.find((s) => s.id === 's4');
      const newSlot = state.slots.find((s) => s.id === 's7');
      if (oldSlot && newSlot && newSlot.clientId === null) {
        newSlot.clientId = oldSlot.clientId;
        newSlot.status = 'confirmed';
        newSlot.format = 'Мини-группа (перенос)';
        oldSlot.clientId = null;
        oldSlot.status = 'free';
      }
      addAudit(
        `Помощник + ${state.activeAdmin}`,
        'Кира Лебедева перенесена с 11:00 на свободное окно 16:00 (Дорожка 1, Тренер Дмитрий).'
      );
      addChat(
        'Бот Family Time',
        'bot',
        'Артёму Лебедеву: перенесли тренировку Киры на сегодня в 16:00 (Дорожка 1). Ждём вас!'
      );
      showToast(
        'Перенос выполнен без накладок!',
        'Кира перенесена на 16:00, окно в 11:00 освободилось, а папа сразу получил подтверждение в MAX.'
      );
    }

    markStepDone('s3');
    renderAll();
  }

  function runScenario(key) {
    if (key === 'confirm-masha') {
      const slot = state.slots.find((s) => s.id === 's2');
      addChat('Ольга Орлова (MAX)', 'user', '[Нажата кнопка «Придём ✅» для Маши на 10:00]');
      if (slot && slot.status === 'scheduled') {
        slot.status = 'confirmed';
        addChat('Бот Family Time', 'bot', 'Спасибо! Ждём Машу сегодня в 10:00 (Малая чаша, Тренер Ирина).');
        addAudit('Бот Family Time', 'Ольга Орлова подтвердила визит Маши на 10:00 кнопкой в MAX.');
        showToast(
          'Подтверждение без участия админа',
          'Мама нажала 1 кнопку в MAX — статус Маши на экране админа сам стал зелёным «Подтверждён».'
        );
      } else {
        addChat('Бот Family Time', 'bot', 'Визит Маши на 10:00 уже отмечен в расписании.');
      }
      markStepDone('s2');
    } else if (key === 'illness-vasya') {
      addChat(
        'Наталья Смирнова (MAX)',
        'user',
        'Здравствуйте, Вася приболел, сегодня в 11:00 не придём. Прикрепляю фото справки [справка_Вася.jpg].'
      );
      const already = state.pendingActions.some((a) => a.type === 'freeze_vasya');
      const slot = state.slots.find((s) => s.id === 's3');
      if (!already && slot && slot.status !== 'frozen') {
        state.pendingActions.unshift({
          id: 'pa_vasya',
          type: 'freeze_vasya',
          title: 'Заморозка по справке: Вася Смирнов (11:00)',
          detail: 'Помощник прочитал фото справки (действует до 25.12.2026). Предлагает заморозить занятие без списания и обновить дату справки.'
        });
        addChat('Умный помощник', 'bot', 'Справка распознана. Черновик заморозки отправлен администратору на подтверждение.');
        addAudit('Умный помощник', 'Создан черновик заморозки по фото справки для Васи Смирнова.');
        showToast(
          'Готов черновик заморозки!',
          'Помощник сам разобрал фото справки. Теперь нажмите «Подтвердить ✓» в блоке черновиков выше.'
        );
      }
      markStepDone('s2');
    } else if (key === 'reschedule-kira') {
      addChat(
        'Артём Лебедев (MAX)',
        'user',
        'Не успеваем с Кирой к 11:00, можно перенести сегодня на 16:00?'
      );
      const already = state.pendingActions.some((a) => a.type === 'move_kira');
      const freeSlot = state.slots.find((s) => s.id === 's7' && s.clientId === null);
      if (!already && freeSlot) {
        state.pendingActions.unshift({
          id: 'pa_kira',
          type: 'move_kira',
          title: 'Перенос: Кира Лебедева 11:00 → 16:00',
          detail: 'Помощник проверил расписание: у тренера Дмитрия на 16:00 (Дорожка 1) есть свободное окно. Подтвердить перенос?'
        });
        addChat('Умный помощник', 'bot', 'Нашёл свободное окно в 16:00 у тренера Дмитрия. Передал черновик администратору.');
        addAudit('Умный помощник', 'Предложен перенос Киры Лебедевой на свободное окно 16:00.');
        showToast(
          'Свободное окно найдено автоматически!',
          'Админу не нужно листать журнал — просто нажмите «Подтвердить ✓» в черновике выше.'
        );
      } else {
        addChat('Бот Family Time', 'bot', 'Перенос уже в обработке или окно 16:00 уже занято.');
      }
      markStepDone('s2');
    } else if (key === 'faq-new') {
      addChat('Новый клиент (MAX)', 'user', 'Добрый день! Подскажите стоимость пробного и нужна ли справка?');
      addChat(
        'Бот Family Time',
        'bot',
        'Здравствуйте! В «Family Time» пробное занятие — 900 ₽, абонемент на 8 занятий — 6 400 ₽. С собой нужны плавки/купальник, шапочка и справка от педиатра. Подобрать удобное время?'
      );
      addAudit('Умный помощник', 'Автоответ новому клиенту в MAX (администратор не отвлекался).');
      showToast(
        'Быстрый ответ за 3 секунды!',
        'Новый клиент получил понятный ответ сразу, даже если администратор занят встречей гостей.'
      );
      markStepDone('s2');
    }

    renderAll();
  }

  function buildTrainerCronText() {
    const irinaSlots = state.slots.filter((s) => s.trainer === 'Тренер Ирина' && s.clientId);
    const lines = ['☀️ Утреннее расписание (08:00 · MAX)', 'Ирина, доброе утро! Ваши дети на сегодня в Family Time:'];
    for (const s of irinaSlots) {
      const c = findClient(s.clientId);
      const tag = s.status === 'confirmed' ? '✅ придёт' : s.status === 'frozen' ? '❄️ заморожен' : '⏳ ждём ответ';
      lines.push(`• ${s.time} — ${c.child} (${s.lane}) ${tag}`);
    }
    return lines.join('\n');
  }

  function buildOwnerCronText() {
    const occupied = state.slots.filter((s) => s.clientId);
    const attended = occupied.filter((s) => s.status === 'attended').length;
    const frozen = occupied.filter((s) => s.status === 'frozen').length;
    const lowSubs = state.clients.filter((c) => c.remaining <= 1).map((c) => c.child);
    return [
      '🌙 Вечерняя сводка владельцу (21:00 · MAX)',
      `Family Time · Смена: ${state.activeAdmin}`,
      `• Записано сегодня: ${occupied.length}`,
      `• Отмечено приходов: ${attended}`,
      `• Заморозок по справке: ${frozen}`,
      `• Осталось ≤ 1 занятия: ${lowSubs.length ? lowSubs.join(', ') : 'пока нет'}`,
      `• Черновиков на проверке: ${state.pendingActions.length}`
    ].join('\n');
  }

  function refreshCronIfOpen() {
    const out = document.getElementById('cron-preview-output');
    if (!currentCronMode || out.hidden) return;
    out.textContent = currentCronMode === 'trainer' ? buildTrainerCronText() : buildOwnerCronText();
  }

  // Savings Calculator
  const calcKids = document.getElementById('calc-kids');
  const calcMsgs = document.getElementById('calc-msgs');

  function updateCalculator() {
    const kids = Number(calcKids.value);
    const msgs = Number(calcMsgs.value);
    document.getElementById('calc-kids-val').textContent = String(kids);
    document.getElementById('calc-msgs-val').textContent = String(msgs);

    const minsJournal = Math.round(kids * 1.8);
    const minsChats = Math.round(msgs * 1.4);
    const minsCerts = Math.round(12 + kids * 0.35);
    const totalDailyMins = minsJournal + minsChats + minsCerts;

    const weekHours = Math.round((totalDailyMins * 7) / 60);
    const monthHours = Math.round((totalDailyMins * 30) / 60);
    const shifts = (monthHours / 8).toFixed(1).replace('.0', '');

    document.getElementById('calc-week-hours').textContent = `${weekHours} ч`;
    document.getElementById('calc-month-hours').textContent = `${monthHours} ч`;
    document.getElementById('calc-shifts').textContent = `${shifts} смен`;

    const breakdown = document.getElementById('calc-breakdown');
    breakdown.replaceChildren();
    const rows = [
      ['Расписание, отметки и Excel', `−${minsJournal} мин/день`],
      ['Напоминания, ответы в MAX и тренеры', `−${minsChats} мин/день`],
      ['Разбор справок и поиск окон переноса', `−${minsCerts} мин/день`]
    ];
    for (const [label, val] of rows) {
      const row = el('div', 'breakdown-row');
      row.append(el('span', '', label), el('strong', '', val));
      breakdown.appendChild(row);
    }
  }

  calcKids.addEventListener('input', updateCalculator);
  calcMsgs.addEventListener('input', updateCalculator);

  // Benefits role filter
  const roleBtns = Array.from(document.querySelectorAll('[data-role-filter]'));
  const benefitCards = Array.from(document.querySelectorAll('#benefits-grid .benefit-card'));
  for (const btn of roleBtns) {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.roleFilter;
      for (const b of roleBtns) {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      }
      for (const card of benefitCards) {
        card.hidden = filter !== 'all' && card.dataset.role !== filter;
      }
    });
  }

  // Mobile simulator view switcher
  const simLayout = document.getElementById('sim-layout');
  const mobBtns = Array.from(document.querySelectorAll('[data-mob-view]'));
  function setMobileView(view) {
    simLayout.dataset.mobView = view;
    for (const b of mobBtns) {
      const active = b.dataset.mobView === view;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', String(active));
    }
  }
  for (const btn of mobBtns) {
    btn.addEventListener('click', () => setMobileView(btn.dataset.mobView));
  }

  // Accessible tabs
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

  function selectTab(targetTab, focusTab = false) {
    state.activeTab = targetTab.id;
    for (const tab of tabs) {
      const active = tab === targetTab;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    for (const panel of panels) {
      const isMatch = panel.getAttribute('aria-labelledby') === targetTab.id;
      if (isMatch) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', 'until-found');
      }
    }
    targetTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (focusTab) targetTab.focus();
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      const idx = tabs.indexOf(tab);
      let nextIdx = null;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
      if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') nextIdx = 0;
      if (e.key === 'End') nextIdx = tabs.length - 1;
      if (nextIdx !== null) {
        e.preventDefault();
        selectTab(tabs[nextIdx], true);
      }
    });
  }

  for (const panel of panels) {
    panel.addEventListener('beforematch', () => {
      const ownerId = panel.getAttribute('aria-labelledby');
      const ownerTab = tabs.find((t) => t.id === ownerId);
      if (ownerTab) selectTab(ownerTab);
    });
  }

  // Compare mode switch
  const compareGrid = document.getElementById('compare-grid');
  const compareBtns = Array.from(document.querySelectorAll('[data-compare-mode]'));
  for (const btn of compareBtns) {
    btn.addEventListener('click', () => {
      compareGrid.dataset.mode = btn.dataset.compareMode;
      for (const b of compareBtns) {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      }
    });
  }

  // Shift switch
  const shiftBtns = Array.from(document.querySelectorAll('[data-admin]'));
  for (const btn of shiftBtns) {
    btn.addEventListener('click', () => {
      state.activeAdmin = btn.dataset.admin;
      for (const b of shiftBtns) {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      }
      showToast(
        `Переключена смена: ${state.activeAdmin}`,
        'Теперь все действия записываются на этого администратора — владелец всегда видит, кто и когда внёс правку.'
      );
      renderAll();
    });
  }

  // Search clients
  document.getElementById('client-search').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderClients();
  });

  // Scenario buttons
  for (const btn of document.querySelectorAll('[data-scenario]')) {
    btn.addEventListener('click', () => runScenario(btn.dataset.scenario));
  }

  // Cron preview buttons
  const cronOut = document.getElementById('cron-preview-output');
  document.getElementById('preview-trainer-btn').addEventListener('click', () => {
    if (!cronOut.hidden && currentCronMode === 'trainer') {
      cronOut.hidden = true;
      currentCronMode = null;
      return;
    }
    currentCronMode = 'trainer';
    cronOut.hidden = false;
    cronOut.textContent = buildTrainerCronText();
    showToast(
      'Утренний список тренеру в 08:00',
      'Приходит автоматически каждый день — тренерам не нужно писать администраторам с утра.'
    );
  });

  document.getElementById('preview-owner-btn').addEventListener('click', () => {
    if (!cronOut.hidden && currentCronMode === 'owner') {
      cronOut.hidden = true;
      currentCronMode = null;
      return;
    }
    currentCronMode = 'owner';
    cronOut.hidden = false;
    cronOut.textContent = buildOwnerCronText();
    showToast(
      'Вечерняя сводка владельцу в 21:00',
      'Все итоги дня прямо в телефоне: сколько детей пришло, сколько заморозок и кому пора продлить абонемент.'
    );
  });

  // Toast close
  document.getElementById('toast-close').addEventListener('click', () => {
    document.getElementById('benefit-toast').hidden = true;
  });

  // Reset demo
  document.getElementById('reset-demo-btn').addEventListener('click', () => {
    state = clone(INITIAL_STATE);
    document.getElementById('client-search').value = '';
    cronOut.hidden = true;
    currentCronMode = null;
    for (const b of shiftBtns) {
      const active = b.dataset.admin === state.activeAdmin;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    }
    selectTab(document.getElementById('tab-schedule'));
    setMobileView('panel');
    showToast('Демка сброшена', 'Можно пройти сценарии заново с чистого листа.');
    renderAll();
  });

  updateCalculator();
  renderAll();
})();
