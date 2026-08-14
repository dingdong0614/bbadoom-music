const WEB3FORMS_ACCESS_KEY = "25f74fdb-ce22-49d1-9cd7-576a68637237";

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = contactForm.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "전송 중...";

    const formData = new FormData(contactForm);
    formData.append("access_key", WEB3FORMS_ACCESS_KEY);
    formData.append("subject", "[빠둠뮤직 문의]");
    formData.append("from_name", "빠둠뮤직 웹사이트");

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      formStatus.classList.remove("is-error", "is-success");
      if (result.success) {
        formStatus.textContent = "문의가 접수되었습니다. 빠르게 연락드릴게요.";
        formStatus.classList.add("is-visible", "is-success");
        contactForm.reset();
      } else {
        formStatus.textContent = "전송에 실패했습니다. 잠시 후 다시 시도해주세요.";
        formStatus.classList.add("is-visible", "is-error");
      }
    } catch (err) {
      formStatus.classList.remove("is-success");
      formStatus.textContent = "전송에 실패했습니다. 잠시 후 다시 시도해주세요.";
      formStatus.classList.add("is-visible", "is-error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "문의 보내기";
    }
  });
}
