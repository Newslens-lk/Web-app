-- Small demo dataset so the UI has something to render on a fresh local DB.
-- Safe to delete (`TRUNCATE articles, events, sources;`) once the real pipeline
-- data is loaded. Embeddings are left NULL: similar-article search stays empty.
INSERT INTO sources (source_name, source_type) VALUES
    ('hirunews',    'news_site'),
    ('bbc_sinhala', 'news_site'),
    ('lankadeepa',  'news_site'),
    ('newsfirst',   'news_site'),
    ('divaina',     'news_site')
ON CONFLICT (source_name) DO NOTHING;

INSERT INTO events (event_id, summary, topic, article_count, source_count, window_start, window_end) VALUES
    ('11111111-1111-1111-1111-111111111111',
     'Cabinet approves the 2026 fuel pricing formula',
     'economy', 3, 3, now() - interval '30 hours', now() - interval '6 hours'),
    ('22222222-2222-2222-2222-222222222222',
     'Heavy rains flood parts of the Kelani basin',
     'weather', 3, 3, now() - interval '20 hours', now() - interval '2 hours'),
    ('33333333-3333-3333-3333-333333333333',
     'Sri Lanka names squad for the Asia Cup',
     'sports', 2, 2, now() - interval '50 hours', now() - interval '26 hours')
ON CONFLICT (event_id) DO NOTHING;

INSERT INTO articles (
    article_id, source_name, url, title, body, image_url, language,
    published_at, scraped_at, bias_label, bias_confidence, bias_scores, event_id
) VALUES
    ('demo-fuel-hiru', 'hirunews',
     'https://example.com/demo/fuel-hiru',
     'ඉන්ධන මිල සූත්‍රයට කැබිනට් අනුමැතිය',
     'The cabinet approved a revised monthly fuel pricing formula, which officials say will pass global price changes to consumers more predictably.',
     'https://picsum.photos/seed/fuel-hiru/800/450', 'si',
     now() - interval '8 hours', now() - interval '7 hours',
     'center', 0.72, '{"far_left":0.04,"left":0.14,"center":0.62,"right":0.16,"far_right":0.04}', '11111111-1111-1111-1111-111111111111'),

    ('demo-fuel-bbc', 'bbc_sinhala',
     'https://example.com/demo/fuel-bbc',
     'New fuel formula: what changes for households',
     'Analysts warn the revised formula shifts more of the currency risk onto households, while the ministry says the change protects the state balance sheet.',
     'https://picsum.photos/seed/fuel-bbc/800/450', 'si',
     now() - interval '10 hours', now() - interval '9 hours',
     'left', 0.66, '{"far_left":0.09,"left":0.55,"center":0.24,"right":0.09,"far_right":0.03}', '11111111-1111-1111-1111-111111111111'),

    ('demo-fuel-divaina', 'divaina',
     'https://example.com/demo/fuel-divaina',
     'Fuel reform signals return to fiscal discipline',
     'The decision was welcomed by business chambers, who described it as a long-delayed step towards cost-reflective pricing.',
     'https://picsum.photos/seed/fuel-divaina/800/450', 'si',
     now() - interval '6 hours', now() - interval '5 hours',
     'right', 0.61, '{"far_left":0.03,"left":0.10,"center":0.24,"right":0.52,"far_right":0.11}', '11111111-1111-1111-1111-111111111111'),

    ('demo-flood-newsfirst', 'newsfirst',
     'https://example.com/demo/flood-newsfirst',
     'Kelani river rises; hundreds moved to safety',
     'The Disaster Management Centre said families in low-lying areas of Kaduwela and Kolonnawa were relocated overnight as water levels rose.',
     'https://picsum.photos/seed/flood-newsfirst/800/450', 'si',
     now() - interval '3 hours', now() - interval '2 hours',
     'center', 0.81, '{"far_left":0.03,"left":0.11,"center":0.71,"right":0.12,"far_right":0.03}', '22222222-2222-2222-2222-222222222222'),

    ('demo-flood-lankadeepa', 'lankadeepa',
     'https://example.com/demo/flood-lankadeepa',
     'කැලණි ගඟේ ජල මට්ටම ඉහළ යයි',
     'Residents said drainage work promised after the last floods was never completed, and blamed local authorities for the repeated damage.',
     'https://picsum.photos/seed/flood-lankadeepa/800/450', 'si',
     now() - interval '4 hours', now() - interval '3 hours',
     'far_left', 0.58, '{"far_left":0.46,"left":0.31,"center":0.15,"right":0.06,"far_right":0.02}', '22222222-2222-2222-2222-222222222222'),

    ('demo-flood-hiru', 'hirunews',
     'https://example.com/demo/flood-hiru',
     'Relief camps opened in three divisions',
     'Three schools have been converted into relief camps, with dry rations distributed by the district secretariat.',
     NULL, 'si',
     now() - interval '2 hours', now() - interval '1 hour',
     'center', 0.77, '{"far_left":0.04,"left":0.13,"center":0.66,"right":0.13,"far_right":0.04}', '22222222-2222-2222-2222-222222222222'),

    ('demo-cricket-newsfirst', 'newsfirst',
     'https://example.com/demo/cricket-newsfirst',
     'Selectors name 15-member Asia Cup squad',
     'The squad includes two uncapped spinners, with the captain retained despite a lean run of scores.',
     'https://picsum.photos/seed/cricket-newsfirst/800/450', 'si',
     now() - interval '27 hours', now() - interval '26 hours',
     'center', 0.69, '{"far_left":0.05,"left":0.15,"center":0.60,"right":0.16,"far_right":0.04}', '33333333-3333-3333-3333-333333333333'),

    ('demo-cricket-divaina', 'divaina',
     'https://example.com/demo/cricket-divaina',
     'Squad selection raises familiar questions',
     'Former players questioned the balance of the side, arguing the batting order remains untested against pace.',
     NULL, 'si',
     now() - interval '30 hours', now() - interval '29 hours',
     'far_right', 0.54, '{"far_left":0.02,"left":0.07,"center":0.18,"right":0.31,"far_right":0.42}', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (article_id) DO NOTHING;
