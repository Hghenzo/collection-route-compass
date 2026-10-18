<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Planning and history exports use the shared spreadsheet workbook and planning-row mapper, preserving all stored row fields plus date, shift, and route code; CSV separators belong to sheet_to_csv, not WritingOptions.
- The root route redirects to /dashboard, whose authenticated layout handles access, so the initial preview never shows the template placeholder.
- Operational screens share the operations query cache and invalidate it after mutations, keeping dashboard, routes, and history consistent.
- Shared planning rules validate duplicate reasons and count route-level indicators, preventing store counts from being presented as route counts.
- CSV imports decode UTF-8 before parsing, preserving Portuguese headers and operational addresses.
- Store registration and operational settings use shared validation rules; mutations read back the affected row and invalidate the operations cache to avoid reporting inaccessible or unsaved records as successful.
