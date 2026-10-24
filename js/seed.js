/* ============================================================
   seed.js — Primera ejecución + datos de demostración.
   Las rutinas A/B son las plantillas reales del documento maestro,
   editables y desactivables. El modo demo ES EXPLÍCITO y reversible.
   ============================================================ */
window.OR = window.OR || {};

OR.seed = (function () {
  const U = OR.util;

  /* --- Secuencias reales --- */
  const SEQ_A = ['Levantarse y vestirse','Lavar la cara','Peinarse','Aplicar desodorante',
    'Ayudar a preparar a mis hermanos','Responsabilidades matutinas',
    'Cepillarse los dientes y desayunar cuando sea viable','Beber agua','Lavar los platos utilizados',
    'Revisar encargos familiares','Elegir la misión principal del día','Avanzar en RGS (si no hay urgencia)',
    'Atender comidas, agua, hogar y familia','Estudios o ejercicio cuando sea posible',
    'Registrar resultados','Preparar ropa y pertenencias','Recoger escritorio y espacio de trabajo',
    'Cepillarse los dientes antes de dormir','Prepararse para descansar'];
  const SEQ_B = ['Levantarse y vestirse','Higiene básica','Peinarse','Preparar pertenencias',
    'Atender el traslado familiar','Regresar: desayunar / beber agua si hace falta',
    'Revisar obligaciones domésticas y familiares','Elegir una misión viable',
    'Trabajar, estudiar o tareas según el tiempo disponible','Registrar resultados',
    'Higiene nocturna','Preparar el día siguiente','Dormir con antelación al próximo despertar'];

  const DENTAL = ['Cepillarse los dientes por la mañana','Cepillarse los dientes por la noche'];
  const CHORES = ['Lavar platos','Despejar la mesa','Hacer la cama','Recoger el escritorio','Mantener ordenados los espacios'];

  async function routineFrom(title, area, sequence, recurrence, extra = {}) {
    return OR.store.saveRoutine({
      title, area, sequence, recurrence, startDate: U.day(),
      reminders: extra.reminders || [], ...extra,
    });
  }

  /* Primera ejecución: rutinas base, sin datos personales inventados */
  async function firstRun() {
    const s = await OR.store.settings();
    if (s.onboarded) return;
    await routineFrom('Rutina mañana — casa padre', 'core', SEQ_A, { type: 'daily' }, { house: 'padre', wakeTime: '06:30', streakType: 'core' });
    await routineFrom('Rutina mañana — casa madre', 'core', SEQ_B, { type: 'daily' }, { house: 'madre', wakeTime: '05:45', streakType: 'core', active: true });
    await routineFrom('Higiene dental', 'core', DENTAL, { type: 'daily' }, { streakType: 'core' });
    await routineFrom('Baño', 'core', [], { type: 'interval', everyN: 2 }, { note: 'Posponible sin penalización si la regadera no funciona.', streakType: 'core' });
    await routineFrom('Ejercicio — calistenia 20-30 min', 'core', [], { type: 'weekdays', days: [1,2,3,4,5] }, { streakType: 'exercise' });
    await routineFrom('Tareas domésticas', 'home', CHORES, { type: 'daily' }, { streakType: 'home' });
    // Proyectos RGS existentes (sin tareas inventadas)
    await OR.store.saveTask({ title: 'DataForge CLI — backlog', area: 'rgs', project: 'DataForge CLI', priority: 'alta', status: 'en-curso', isProjectStub: true, desc: 'Proyecto profesional principal. Añade aquí sus tareas.' });
    await OR.store.saveTask({ title: 'KlueCRM — backlog', area: 'rgs', project: 'KlueCRM', priority: 'normal', status: 'pendiente', isProjectStub: true, desc: 'Proyecto secundario. Añade aquí sus tareas.' });
    // Registro académico real (IVEA completado)
    await OR.store.saveAcademic({ kind: 'nota', name: 'IVEA completado — 9/9 exámenes, promedio 9.2', institution: 'IVEA', status: 'verificado', confidence: 'alta', notes: 'Base académica previa. Interés: Informática, IA, ciberseguridad, hardware.' });
  }

  /* Datos de demostración: SOLO si el usuario los activa. Marcados como demo. */
  async function enableDemo() {
    const today = U.day();
    const demoTasks = [
      { title: 'Demo: dividir DataForge en módulos', area: 'rgs', project: 'DataForge CLI', priority: 'critica', status: 'en-curso', tags: ['demo'], due: today },
      { title: 'Demo: comparar 3 carreras de informática', area: 'learning', priority: 'alta', status: 'pendiente', tags: ['demo'] },
      { title: 'Demo: lavar platos', area: 'home', priority: 'normal', status: 'pendiente', tags: ['demo'] },
      { title: 'Demo: sesión de calistenia', area: 'core', priority: 'normal', status: 'completada', tags: ['demo'], completedAt: new Date().toISOString() },
    ];
    for (const t of demoTasks) await OR.store.saveTask(t);
    await OR.store.saveResult({ title: 'Demo: parser de exportación', project: 'DataForge CLI', whatChanged: 'Nuevo comando export', delivered: 'v0.2 listo', githubUrl: 'https://github.com/example', tags: ['demo'], date: today });
    // Actividad de los últimos 14 días para las gráficas (marcada como demo)
    for (let i = 13; i >= 0; i--) {
      const d = U.addDays(today, -i);
      await OR.db.put('occurrences', { id: 'demo-ex:' + d, routineId: 'demo-exercise', date: d, status: i % 5 === 0 ? 'skipped' : 'done', createdAt: new Date().toISOString(), demo: true });
    }
    await OR.store.saveSettings({ demo: true });
  }

  async function disableDemo() {
    for (const t of await OR.db.query('tasks', x => x.tags && x.tags.includes('demo'))) await OR.db.del('tasks', t.id);
    for (const r of await OR.db.query('results', x => x.tags && x.tags.includes('demo'))) await OR.db.del('results', r.id);
    for (const o of await OR.db.query('occurrences', x => x.demo)) await OR.db.del('occurrences', o.id);
    await OR.store.saveSettings({ demo: false });
  }

  return { firstRun, enableDemo, disableDemo, SEQ_A, SEQ_B };
})();
