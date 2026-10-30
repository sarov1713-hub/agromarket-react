expect(
  screen.getByRole('heading', { name: 'Несуществующий заголовок' })
).toBeInTheDocument()