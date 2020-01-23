# Test Plan: Tiered Access Sensitive Records Exclusion 

## Setup
1. Guppy should have tiered access enabled (`tierAccessLevel: 'regular'`).
2. The tiered access limit should be set to 1, so that we can count the number of records in unaccessible studies (`tierAccessLimit: 1`) without the counts being hidden because they
are below the tierAccessLimit threshold.
3. Guppy should have sensitive study exclusion enabled (`tierAccessSensitiveRecordExclusionField: 'sensitive'})`)
4. Guppy should be connected to an ES index `$indexName` that contains `N` records. Of those records, `N_unaccessible` records should be accessible to the test user. (Leaving `N_acessible` accessible records). Of the `N_unaccessible` records, `N_sensitive_unaccessible` records
should be marked sensitive (the field specified in `tierAccessSensitiveRecordExclusionField` should be set to `"true"` in the ES index.)

## Tests
1.  __Accessible records__: POST `[guppyURL]/graphql` with body:
```
{
  _aggregation{
    $indexName(accessibility: accessible) {
      _totalCount
    }
  }
}
```
* Expected output: 
```
{
    "data": {
        "_aggregation": {
            "$indexName": {
                "_totalCount": N_accessible
            }
        }
    }
}
```
* Accessible records should be included whether or not they are sensitive.
2.  __Unaccessible records__: POST `[guppyURL]/graphql` with body:
```
{
  _aggregation{
    $indexName(accessibility: unaccessible) {
      _totalCount
    }
  }
}
```
* Expected output: 
```
{
    "data": {
        "_aggregation": {
            "$indexName": {
                "_totalCount": N_unaccessible - N_sensitive_unaccessible
            }
        }
    }
}
```
* Sensitive records that are in unaccessible resources should not be included in the count.

5.  __All cases__: POST `[guppyURL]/graphql` with body:
```
{
  _aggregation{
    $indexName(accessibility: all) {
      _totalCount
    }
  }
}
```
* Expected output: 
```
{
    "data": {
        "_aggregation": {
            "$indexName": {
                "_totalCount": N - N_sensitive_unaccessible
            }
        }
    }
}
```
* Sensitive records that are in unaccessible resources should not be included in the count.

## Setup for backwards compatibility test
1. Same as original setup, but Guppy should have sensitive study exclusion disabled. (No `tierAccessSensitiveRecordExclusionField` in config)

## Backwards compatibility test
1.  __Accessible records__: POST `[guppyURL]/graphql` with body:
```
{
  _aggregation{
    $indexName(accessibility: accessible) {
      _totalCount
    }
  }
}
```
* Expected output: 
```
{
    "data": {
        "_aggregation": {
            "$indexName": {
                "_totalCount": N_accessible
            }
        }
    }
}
```
* Accessible records should be included whether or not they are sensitive.
2.  __Unaccessible records__: POST `[guppyURL]/graphql` with body:
```
{
  _aggregation{
    $indexName(accessibility: unaccessible) {
      _totalCount
    }
  }
}
```
* Expected output: 
```
{
    "data": {
        "_aggregation": {
            "$indexName": {
                "_totalCount": N_unaccessible
            }
        }
    }
}
```
* Because sensitive record exclusion is disabled, Guppy should include the sensitive
records in the aggregation.

5.  __All cases__: POST `[guppyURL]/graphql` with body:
```
{
  _aggregation{
    $indexName(accessibility: all) {
      _totalCount
    }
  }
}
```
* Expected output: 
```
{
    "data": {
        "_aggregation": {
            "$indexName": {
                "_totalCount": N
            }
        }
    }
}
```
* Because sensitive record exclusion is disabled, Guppy should include the sensitive
records in the aggregation.
