# sounds.dylanfisher.com

Is it music?

## TODO

- Add button to sounds to retrigger after_save_callbacks on media item
- Document dokku deployment

## Dokku

### Download a database backup to local

```
ssh root@sounds.dylanfisher.com "dokku postgres:export sounds_production | gzip -c > /tmp/backup.sql.gz" \
&& scp root@sounds.dylanfisher.com:/tmp/backup.sql.gz ~/projects/sounds/db_backups/backup.sql.gz \
&& ssh root@sounds.dylanfisher.com "rm -f /tmp/backup.sql.gz"
```

`bin/rails db:drop db:create && gunzip -c ./db_backups/backup.sql.gz | pg_restore --verbose --host localhost  --clean --no-owner --no-acl --dbname sounds_development`
