const fields = { name: 'Имя / название', email: 'Email', password: 'Пароль', price: 'Цена', category: 'Категория', unit: 'Единица измерения', image: 'Изображение' };

export default function FormError({ error }) {
  if (!error) return null;
  return <div className="form-error" role="alert">
    <p>{error.message}</p>
    {error.details?.length > 0 && <ul>{error.details.map((detail, index) =>
      <li key={`${detail.field}-${index}`}>{fields[detail.field] || detail.field || 'Форма'}: {detail.message}</li>,
    )}</ul>}
  </div>;
}
