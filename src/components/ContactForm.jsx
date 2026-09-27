const API_URL = 'http://localhost:3000/api';

function ContactForm() {
    async function handleSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const data = Object.fromEntries(new FormData(form));

        try {
            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) {
                alert('Ошибка: ' + result.error);
                return;
            }

            alert(`Заявка №${result.id} принята!`);
            form.reset();
        } catch (err) {
            alert('Сервер недоступен. Запущен ли agromarket-server?');
        }
    }

    return (
        <section id="contact" className="contact">
            <h2>Оптовая заявка</h2>

            <form
                className="contact-form"
                onSubmit={handleSubmit}
            >
                <label htmlFor="name">
                    Имя / организация
                </label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    required
                />

                <label htmlFor="email">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="farmer@mail.kz"
                    required
                />

                <label htmlFor="phone">
                    Телефон
                </label>
                <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+7 7XX XXX XX XX"
                    required
                />

                <label htmlFor="quantity">
                    Объём заказа (кг)
                </label>
                <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="10"
                    required
                />

                <label htmlFor="date">
                    Желаемая дата доставки
                </label>
                <input
                    id="date"
                    name="date"
                    type="date"
                />

                <label htmlFor="comment">
                    Комментарий
                </label>
                <textarea
                    id="comment"
                    name="comment"
                    rows="4"
                />

                <button type="submit">
                    Отправить заявку
                </button>
            </form>
        </section>
    );
}

export default ContactForm;