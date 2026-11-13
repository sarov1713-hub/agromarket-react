# ЛР12 — фактический отчёт

Дата выполнения: 13 ноября 2026. Основной текст задания получен во вложении. Оригинальный DOCX в доступных вложениях отсутствовал; отдельную сверку с ним не заявляем.

## 1. Что уже было реализовано

Frontend на main `c9b8f25`: React/Vite без React Router, Vitest/jsdom/RTL/jest-dom/user-event, 23 успешных теста (8,22 с), 4 Playwright-сценария, CI с check `build`, deploy Vercel. MSW не был установлен. Существовали корректные labels, серверные ошибки, ограничение формы создания товаров ролью admin, JWT в localStorage, изображения продуктов.

Backend обновлён fast-forward до main `199bebe`. Есть Express/PostgreSQL, JWT, Zod, Helmet/CORS/rate limit и 82 теста. Прежний production-E2E создавал пользователя и заявку; этот небезопасный запуск больше не используется.

## 2. Что сделано

Код: [PR #10](https://github.com/sarov1713-hub/agromarket-react/pull/10), ветка `test/frontend`.

- ProductCard: отображение категории и стабильный testid; исходные картинки и кнопка сохранены. stock и отдельная страница товара в реальном приложении отсутствуют, специально не добавлялись.
- App: доступные состояния loading/error, кнопка повторной загрузки, тесты восстановления, ролей, регистрации и localStorage.
- MSW: setup/server/handlers/utils, реальные форматы массива товаров, user/token и details. Старые сценарии сохранены, каталог переведён с fetch-spy на сетевой перехват.
- NetworkForms: 401/429/400, задержка, блокировка повторной отправки, отсутствие ложного успеха, правильный payload товара и HTML-валидация -500.
- Playwright: 7 сценариев; настоящий локальный Express, отдельная локальная PostgreSQL и очистка записей.
- Защита production: внешний адрес разрешает только smoke; браузерные записи блокируются. Совместимы BASE_URL и E2E_BASE_URL.
- CI: тот же workflow и job `build`, добавлен `test:run`, сохранены lint/build, запуск на PR и рабочих ветках. Scheduled production workflow заменён на smoke.
- PowerShell-helper локальной PostgreSQL, примеры env без реальных секретов, игнорирование локальных секретов/БД/отчётов.
- Lock-файл: совместимые обновления Vite и транзитивной source-map-js устранили два предупреждения audit. Итог `npm audit`: 0 уязвимостей.

Коммиты: `f2fbb21` (компоненты), `8a1dbee` (MSW), `629d2a3` (E2E/CI). Документация — отдельная ветка `docs/lab12` от main, без повторного включения кода тестового PR.

## 3. Компонентные тесты

Итог: **37 passed**, 6 файлов, одноразовый `npm run test:run` — **7,25 с**. Сохранены все прежние сценарии; добавлены проверки категории и клавиатуры, loading/двойного click, ошибок и ролей.

Отдельный эксперимент: ожидание цены изменено с 450 тг на 451 тг; фактический прогон дал 1 failed / 6 passed и exit 1. После восстановления — 7/7 в ProductCard за 2,23 с. Вывод сохранён в [component-failure.txt](evidence/component-failure.txt).

## 4. MSW

MSW 3.0.5 перехватывает GET /products, GET /auth/me, POST /auth/login, /auth/register, /products, /orders. Проверяются успех, задержка, пустой список, HTTP 500, network error, восстановление после 500, 401/429 и details.email/details.price при HTTP 400. Неожиданные запросы запрещены. После каждого теста — cleanup, resetHandlers, очистка localStorage и spy.

Исторические изолированные LoginForm-тесты с vi.mock(apiFetch) и три ServerErrors-теста с fetch-spy сохранены; они дополняют, а не заменяют MSW.

## 5. Настоящие локальные E2E и backend

База на учебной VM 192.168.157.128:5432 была недоступна. Вместо неё создан отдельный локальный кластер официальной PostgreSQL **18.6**, только `127.0.0.1:55432`, база **agromarket_test**, ICU locale ru-RU. Не использовались Neon/production или fake API. Источник бинарников: [официальные Windows binaries](https://www.enterprisedb.com/download-postgresql-binaries).

Первый backend-прогон: 79 passed / 3 failed за 11,94 с — из-за настройки Origin и locale=C. После исправления только тестовой среды: **82 passed**, 8 файлов, **11,20 с**. Отдельные security без БД: 5 passed за 1,11 с; это подмножество 82, не ещё пять независимых тестов.

Локальный Playwright: **7 passed за 11,70 с** после восстановления сломанного ожидания:

1. Неверный пароль: настоящий HTTP 401, сообщение, нет token/session.
2. Вход администратором, создание товара через UI, цена и категория в каталоге, удаление API.
3. Цена -500: HTML rangeUnderflow, 0 POST из формы, отдельный настоящий API-запрос получает 400 details.price.
4. Уникальная регистрация покупателя, корзина и заявка.
5. Гость /admin не получает форму администратора.
6. Smoke каталога и названия страницы.
7. Smoke /login и доступных полей.

В существующей ролевой модели только admin создаёт товары. Поэтому E2E_FARMER_EMAIL/PASSWORD — локальный тестовый администратор, не выдуманная роль farmer. Созданные пользователи/заявки и товары с тестовыми префиксами очищаются; успешный товар удаляется также в finally.

## 6. Production smoke

https://agromarket-react.vercel.app — **2 passed за 33,4 с**. Только каталог/карточка/изображение/заголовок и форма /login. Регистрация, вход с отправкой, заявки и товары на production не создавались. Полный `npm run e2e -- --list` с внешним BASE_URL фактически отклонён конфигурацией до запуска тестов.

Отдельной страницы товара в React нет, поэтому второй smoke проверяет реальную доступную форму входа и SPA fallback, не требует добавления Router. Холодный старт Render учитывается ожиданием карточки до 75 секунд, без произвольного sleep.

## 7. Trace и screenshot

Временно изменено ожидание заголовка на `/Intentional-Lab12-Wrong-Title/`. Тест действительно упал: реальный заголовок `АгроМаркет — фермерские продукты`, timeout 1000 мс, шаг `toHaveTitle`, строка 17 smoke.spec.js. Остальные проверки карточки перед этим прошли.

Извлечены и прочитаны JSON-события trace: callId `hccq@123`, начало 4138 мс, завершение с ошибкой около 5159 мс. Сеть показывает GET / с HTTP 200. Screenshot просмотрен: видны шапка «АгроМаркет», каталог, карточки картофеля/мёда с ценами, картинки и кнопки корзины. Следовательно, проблема в намеренно неверном ожидании, не в загрузке каталога.

Просмотр осуществлён через распакованные trace-события и изображение, интерактивный Trace Viewer не использовался. Ошибка и screenshot: [e2e-failure.txt](evidence/e2e-failure.txt), [e2e-failure.png](evidence/e2e-failure.png). Полный trace оставлен локально в игнорируемой `.lab12-local/trace-failure/**/trace.zip`; не публикуются отчёты полноценных авторизованных прогонов, которые могут содержать сессии.

Правильный regex восстановлен, повторный полный прогон — 7 passed.

## 8. GitHub Actions

Workflow `.github/workflows/ci.yml`, Node.js 22: npm ci → lint → test:run → build. Job по-прежнему называется **build**, чтобы сохранить branch protection.

- Успешный push-run тестовой ветки: [43366804577](https://github.com/sarov1713-hub/agromarket-react/actions/runs/43366804577).
- Успешный PR-run: [43366874756](https://github.com/sarov1713-hub/agromarket-react/actions/runs/43366874756).
- Намеренно красный PR-run: [43366900760](https://github.com/sarov1713-hub/agromarket-react/actions/runs/43366900760), failed на ожидании 451 тг; [вывод](evidence/ci-failure.txt).

Старый e2e.yml в main вручную отключён до merge безопасной smoke-версии из #10. Его нельзя включать до замены: старый файл запускает сценарии с записью в production. Это не отключение защиты ветки или обязательного CI: workflow CI и required build продолжают работать.

## 9. Branch protection и красный CI

Проверено через GitHub API: у main обязательный check `build`, strict=true; force push и удаления ветки запрещены. Настройки не ослаблялись. [Снимок настройки](evidence/branch-protection.json).

Ветка `experiment/failing-frontend-test`, коммит `e2819ef`: только неправильное ожидание 451 тг вместо 450. [PR #11](https://github.com/sarov1713-hub/agromarket-react/pull/11) получил FAILURE от build. После завершения обоих CI запусков GitHub вернул mergeable=MERGEABLE (нет конфликтов), но **mergeStateStatus=BLOCKED** (не выполнены требования checks). Слияние не пытались выполнять, административный обход не использовали.

PR #11 закрыт 13.11.2026 04:39:35 UTC, mergedAt=null. [Снимок закрытого PR](evidence/closed-experiment.json). Преднамеренно сломанный код не попал ни в main, ни в итоговую test/frontend.

Ограничение: enforce_admins=false, то есть администратор может технически обойти правило. required_approving_review_count=0. Это не означает получения человеческого ревью: методичка требует отдельного настоящего напарника.

## 10. GitHub и материалы для сдачи

- Репозиторий: https://github.com/sarov1713-hub/agromarket-react
- PR тестов: https://github.com/sarov1713-hub/agromarket-react/pull/10
- PR документации: https://github.com/sarov1713-hub/agromarket-react/pull/12 — ветка docs/lab12.
- Закрытый эксперимент: https://github.com/sarov1713-hub/agromarket-react/pull/11
- Успешный CI: https://github.com/sarov1713-hub/agromarket-react/actions/runs/43366874756
- Красный CI: https://github.com/sarov1713-hub/agromarket-react/actions/runs/43366900760
- Опубликованный сайт: https://agromarket-react.vercel.app
- Ответы: [LAB12_DEFENSE.md](../../LAB12_DEFENSE.md); команды и объяснения — в README.

## 11. README и бонусы

Сохранены разделы ЛР4 и ЛР10. Добавлены актуальные команды, таблица пирамиды тестов, 14 ответов по выполненным действиям, ссылки и ограничения. Прежние production-E2E результаты ЛР10 обозначены как исторические, не рекомендованы к повторению.

Бонус coverage выполнен: **96,74% lines**, **91,25% branches**, 37 тестов за 7,02 с. Отчёт coverage/index.html генерируется локально. storageState, axe, визуальная регрессия и автоматический smoke по событию Vercel deploy не добавлялись: обязательные сценарии выполняются без хранения авторизованной сессии, а смена deploy-интеграции не требуется.

## 12. Что осталось человеку

1. Настоящее ревью напарником PR #10 и PR документации. Оно не имитировалось и не получено.
2. После ревью и успешного CI слить PR #10, затем документацию. Ветки и main не переписывались, теги v1.0.0 не менялись.
3. Только после появления безопасного `npm run e2e:smoke` в main включить e2e.yml: `gh workflow enable e2e.yml --repo sarov1713-hub/agromarket-react`. Проверить PRODUCTION_URL и ручной smoke workflow.
4. При предоставлении оригинального DOCX сверить дополнительные требования с ним.

Никакие результаты внешнего ревью или будущего merge/deploy не объявляются выполненными.

## 13. Демонстрация (после применения PR #10)

```powershell
cd D:\agromarket-react
git switch test/frontend
npm ci
npm run test:run
npm run lint --if-present
npm run build
& .\scripts\start-test-postgres.ps1
npm run e2e
npx playwright show-report
```

Если открыли show-report, остановите сервер отчёта Ctrl+C перед следующими командами.

```powershell
$env:BASE_URL = 'https://agromarket-react.vercel.app'
npm run e2e:smoke
Remove-Item Env:BASE_URL
$trace = Get-ChildItem .lab12-local\trace-failure -Recurse -Filter trace.zip | Select-Object -First 1
npx playwright show-trace $trace.FullName
```

Локальная PostgreSQL должна работать; Playwright сам запускает Vite/Express, seed только тестовой БД и очищает созданные записи. На другом компьютере нужен существующий backend checkout с `npm ci` и отдельная тестовая PostgreSQL/настройки из .env.e2e.example. E2E перед каждым локальным запуском очищает и пересоздаёт таблицы строго тестовой базы, не используйте её для ручных ценных данных.
