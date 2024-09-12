# sounds.dylanfisher.com

Is it music?

## TODO

- Add button to sounds to retrigger after_save_callbacks on media item
- Document dokku deployment

## Dokku

### Download a database backup to local

`ssh root@sounds.dylanfisher.com "dokku postgres:export sounds_production > /tmp/backup.sql" && scp root@sounds.dylanfisher.com:/tmp/backup.sql ~/projects/sounds/db_backups/backup.sql`

`bin/rails forest:db:restore`
