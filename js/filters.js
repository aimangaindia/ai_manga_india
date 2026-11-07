/* filters.js — small reusable helpers shared by the portfolio and shop:
   text search, chip groups, sorting, "load more" paging. No DOM knowledge of either page. */
(() => {
  const AMI = (window.AMI = window.AMI || {});

  /** Case-insensitive match of a query against several fields. Every word must match somewhere. */
  AMI.matches = (query, ...fields) => {
    const hay = fields.join(" ").toLowerCase();
    return query.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w));
  };

  /** Wires a group of chip buttons. Calls onChange(value) and keeps aria-pressed in sync. */
  AMI.chipGroup = (container, onChange, initial) => {
    const chips = AMI.$$("[data-value]", container);
    const set = v => { chips.forEach(c => { const on = c.dataset.value === v; c.classList.toggle("active", on); c.setAttribute("aria-pressed", on); }); onChange(v); };
    chips.forEach(c => c.addEventListener("click", () => set(c.dataset.value)));
    set(initial || (chips[0] && chips[0].dataset.value));
    return set;
  };

  /** Paging helper: shows `size` more items each time. */
  AMI.pager = (size, render, button) => {
    let list = [], shown = 0;
    const draw = reset => {
      if (reset) shown = 0; shown = Math.min(list.length, shown + size); render(list.slice(0, shown), reset);
      if (button) { button.hidden = shown >= list.length; button.textContent = `Load more (${list.length - shown} left)`; }
    };
    button && button.addEventListener("click", () => draw(false));
    return { set(l) { list = l; draw(true); } };
  };
})();
