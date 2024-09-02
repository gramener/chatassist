import { bookmarklet } from "./utils.js";

function extract() {
  let $form = document.querySelector("#paper-status-form");
  if ($form) $form.remove();
  document.body.insertAdjacentHTML(
    "beforeend",
    /* html */ `
    <form id="paper-status-form" method="POST" action="[ORIGIN]/extract" target="_blank">
      <input type="hidden" name="subject">
      <input type="hidden" name="body">
    </form>
  `,
  );
  $form = document.querySelector("#paper-status-form");
  const subject = document.querySelector(".ticket-subject-heading")?.textContent?.trim();
  const body = document.querySelector(".ticket-details__item__content")?.textContent?.trim();
  $form.querySelector("[name=subject]").value = subject;
  $form.querySelector("[name=body]").value = body;
  // Console.log the serialized form
  console.log($form.innerHTML);
  $form.submit();
  $form.remove();
}

function compose() {
  let $form = document.querySelector("#paper-status-form");
  if ($form) $form.remove();
  document.body.innerHTML += /* html */ `<form id="paper-status-form" method="POST" action="[ORIGIN]/compose" target="_blank"></form>`;
  $form = document.querySelector("#paper-status-form");

  const table2 = document.querySelectorAll(".qts_div_grid table")[1];
  const headers = Array.from(table2.querySelectorAll("th")).map((th) => th.textContent.trim());
  const cells = table2.querySelectorAll("tbody tr td");
  const data = headers.reduce((obj, header, i) => ({ ...obj, [header]: cells[i].textContent.trim() }), {});

  $form.innerHTML = Object.entries(data)
    .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
    .join("");
  $form.submit();
  $form.remove();
}

document.querySelector("#extract-bookmarklet").href = await bookmarklet(extract);
document.querySelector("#compose-bookmarklet").href = await bookmarklet(compose);
