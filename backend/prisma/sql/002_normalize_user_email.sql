-- 既存の User.email を lower(trim(...)) に正規化する。
--
-- アプリ側（frontendのregister/authorize、backendのregister/login）は正規化後の
-- アドレスで検索するようになったため、DBに大文字を含む行が残っていると
-- そのユーザーはどのクライアントからもログインできなくなる。
--
-- 【重要】必ず STEP 1 を先に実行し、衝突が0件であることを確認してから
-- STEP 2 を実行すること。衝突がある場合、STEP 2 はユニーク制約違反で失敗する
-- （データを壊さずに中断するので安全だが、先に名寄せの判断が必要）。

-- ---------------------------------------------------------------------------
-- STEP 1: 正規化すると衝突する（＝同一人物の重複アカウントである）行を検出する
-- ---------------------------------------------------------------------------
SELECT lower(trim(email)) AS normalized,
       count(*)           AS accounts,
       array_agg(id)      AS user_ids,
       array_agg(email)   AS raw_emails
FROM "User"
WHERE email IS NOT NULL
GROUP BY lower(trim(email))
HAVING count(*) > 1;

-- 0件だった場合のみ STEP 2 へ進む。
-- 1件以上ある場合は、どちらのアカウントを残すか（Topic/Memoの移管を含めて）
-- 決めてから改めて実行すること。

-- ---------------------------------------------------------------------------
-- STEP 2: 正規化を適用する
-- ---------------------------------------------------------------------------
-- BEGIN;
-- UPDATE "User"
--    SET email = lower(trim(email))
--  WHERE email IS NOT NULL
--    AND email <> lower(trim(email));
-- COMMIT;
