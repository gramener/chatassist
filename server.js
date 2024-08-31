import express from "express";

const token = process.env.LLMFOUNDRY_TOKEN;
const port = process.env.PORT || 3000;
const app = express();

// Serve static files from public/ folder
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Extract endpoint
app.post("/extract", async (req, res) => {
  const { subject, body } = req.body;
  const apiUrl =
    "https://llmfoundry.straive.com/azure/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-05-01-preview";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content:
            "Extract the manuscript number or DOI as a JSON {id: ...}. Manuscript number looks like CMBL-D-24-00766 (Remove anything after 'R<nn...>'). DOI looks like 10.1038/s41586-024-02513-3. If none found, return {}",
        },
        { role: "user", content: `${subject}\n\n${body}` },
      ],
      response_format: { type: "json_object" },
    }),
  }).then((r) => r.json());
  const json = response?.choices?.[0]?.message?.content ?? "";
  if (json) {
    try {
      const { id } = JSON.parse(json);
      res.send(/* html */`
        <h1>${subject}</h1>
        <form id="chat" action="https://qts.springernature.com/chatbot.php" method="POST" enctype="multipart/form-data" target="_blank">
          <input name="msg" value="${id}">
          <button type="submit">Chat</button>
        </form>
        <script>
          document.getElementById("chat").submit();
        </script>
        `);
    } catch (e) {
      console.error("Error parsing JSON", e);
      res.status(500).send("Error parsing JSON");
    }
  } else {
    res.status(500).send("No JSON found");
  }
});


app.post("/compose", async (req, res) => {
  const apiUrl =
    "https://llmfoundry.straive.com/azure/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-05-01-preview";
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: `"subject" and "body" contain a user's email. Write an reply email explaining the status of the manuscript based on the rest of the information.`,
        },
        { role: "user", content: JSON.stringify(req.body)},
      ],
    }),
  }).then((r) => r.json());
  const content = response?.choices?.[0]?.message?.content ?? "";
  res.send(/* html */ `<pre id="email">${content}</pre>
    <script>navigator.clipboard.writeText(document.querySelector("#email").textContent);</script>
`);
});


app.listen(port, () => {
  console.log(`Running on http://localhost:${port}/`);
});
