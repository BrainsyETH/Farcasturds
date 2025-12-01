# Resolving merge conflicts when many files are affected

When a rebase or merge reports a large number of conflicts (for example, "21 conflicts"), follow these steps to clear them systematically:

1. **Update local refs**
   - Ensure your working tree is clean: `git status`.
   - Fetch the latest mainline changes: `git fetch origin`.

2. **Start from a clean rebase/merge**
   - If you were rebasing, continue with `git rebase origin/main` (or the appropriate target branch).
   - If you were merging, run `git merge origin/main` from your feature branch.

3. **List the conflicted files**
   - Use `git status` or `git diff --name-only --diff-filter=U` to see every file that needs attention. Keep this list open as a checklist.

4. **Resolve conflicts one file at a time**
   - Open each conflicted file and remove conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
   - Decide for each hunk whether to keep your branch (`ours`), the target branch (`theirs`), or a combined edit. Prefer the target branch when the changes are unrelated to your feature, and keep your branch when it contains the intentional updates.
   - For purely mechanical resolutions (e.g., formatting), you can use `git checkout --ours <file>` or `git checkout --theirs <file>` to accept one side, then format if needed.

5. **Re-run formatting and linting**
   - After editing a file, run the repo's formatters/lints if available (e.g., `npm run lint` or `npm run format`) to avoid style-related noise.

6. **Mark files as resolved**
   - Stage each resolved file with `git add <file>`.
   - Check progress with `git status` until no files remain in the unmerged state.

7. **Continue the operation**
   - For a rebase, run `git rebase --continue`. Repeat the resolve/add/continue cycle until the rebase finishes.
   - For a merge, complete with `git commit` once all conflicts are staged.

8. **Verify the result**
   - Run the project's tests or smoke checks relevant to the touched areas.
   - Review the final diff to confirm only intentional changes remain.

9. **Push the updated branch**
   - Push with `git push --force-with-lease` after a rebase, or `git push` after a merge.

If a conflict appears confusing or risky, resolve easier files first and leave tricky ones for the end; this reduces context switching and keeps momentum through a long conflict list.
