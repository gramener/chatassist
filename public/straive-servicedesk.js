import { bookmarklet } from "./utils.js";

async function serviceDesk() {
  let $notification = document.querySelector("#paper-status-notification");
  if (!$notification) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="paper-status-notification" style="position:fixed;top:20px;right:20px;padding:10px 20px;background-color:#333;color:#fff;font-family:Arial,sans-serif;font-size:14px;border-radius:5px;box-shadow:0 2px 10px rgba(0, 0, 0, 0.2);z-index:10000;opacity:0.9;"></div>`
    );
    $notification = document.querySelector("#paper-status-notification");
  }
  const notify = (message) => ($notification.innerHTML = message);

  notify("Extracting Document ID...");
  const subject = document.querySelector(".details-left h1").textContent;
  const messages = [...document.querySelectorAll("[id^=notiDesc]")]
    .map((d) => d.innerText ?? d.shadowRoot?.querySelector("*")?.innerText)
    .filter((d) => d);

  fetch("https://llmfoundry.straive.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Extract the document ID from this text as JSON" },
        { role: "user", content: subject + "\n" + messages.join("\n") },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "math_reasoning",
          schema: {
            type: "object",
            properties: {
              docId: {
                type: "string",
              },
            },
            required: ["docId"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    }),
  })
    .then((r) => r.json())
    .then((response) => {
      const docId = JSON.parse(response.choices[0].message.content).docId;
      notify(`Getting history of Document: ${docId}...`);
      setTimeout(() => {
        notify("Drafting email response...");
        fetch("https://llmfoundry.straive.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a customer service agent. Reply to the user email based on the provided email history.

This is a dummy email for a demo. Reply in a DETAILED and REALISTIC way. Make up data and facts in your reply.

Don't include a subject in your reply. Don't include the greeting or footer. Just the body of the email.

TODAY's DATE: ${new Date().toLocaleDateString()}`,
              },
              {
                role: "user",
                content: `
# User mail
Subject: ${subject}

${messages.join("\n")}
`,
              },
            ],
          }),
        })
          .then((r) => r.json())
          .then((response) => {
            console.log(response);
            navigator.clipboard.writeText(response.choices[0].message.content);
            notify("Copied reply to clipboard!");
            $notification.style.transition = "opacity 2s";
            $notification.style.opacity = "0";
            setTimeout(() => $notification.remove(), 2000);
          });
      }, 1000);
    });
}

document.querySelector("#servicedesk-bookmarklet").href = await bookmarklet(serviceDesk);
