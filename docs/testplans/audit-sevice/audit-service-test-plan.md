# Audit Service test plan

## Overview of the service

The Audit Service code is at https://github.com/uc-cdis/audit-service. It exposes an API to create and query audit logs. It allows us to answer questions such as:
- How many times did `userA` download `file1` this month?
- When did `userA` download `file1`?
- How many users logged in via identity provider `X` last year?

More details can be found in the repo documentation.

**Note:** At the time of writing, there is no endpoint to delete audit logs. To make sure you are querying the right audit data, and not data resulting from previous tests, make sure to use filters when querying logs.

## Technical documents

- [Design doc](https://docs.google.com/document/d/1xcuU4QT1fYN69pmJo-emswvnTpiuWFa1xm7Air67aaw/edit?pli=1#heading=h.f061qmehfpgz)
- [Swagger doc](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/uc-cdis/audit-service/master/docs/openapi.yaml)

## Scope

The scenarios described below cover all the use cases at the time of writing:
- successful login audit logs (login via the portal, or via the OIDC flow)
- successful downloads (presigned URLs) audit logs

## Configuration

The Audit Service should be deployed to Jenkins environments by adding `audit-service` to the manifest, in the versions section.

Audit logs for user logins and data downloads can be enabled by adding the setting `ENABLE_AUDIT_LOGS` to the Fence configuration (see [here](https://github.com/uc-cdis/fence/blob/1c850d07e54f8527dbde182fdd9dd593d18f660e/fence/config-default.yaml#L586-L588)).

For up to date instructions, see the [Audit Service deployment documentation](https://github.com/uc-cdis/audit-service/blob/master/docs/how-to/deployment.md).

## Scenarios

**Data Portal login**

1. User A logs in. To avoid querying audit logs from previous tests, it might be a good idea to choose a username unique to this test.
2. User B has access to query login audit logs. User B queries logs by making a call to the `GET /audit/log/login` endpoint. Use a filter: `username=<user A username>`.
3. The log describing step #1 is returned. Make sure the values look right (for example, `idp` should be populated).
4. User A accesses the portal again, but is still logged in.
5. User B queries logs again.
6. Make sure no new logs have been created.

**OIDC login**

1. Go through the OIDC flow with a client to get tokens on behalf of user A.
2. User B has access to query login audit logs. User B queries logs by making a call to the `GET /audit/log/login` endpoint. Use a filter: `username=<user A username>`.
3. The log describing step #1 is returned. Make sure the values look right (for example, `client_id` should be populated).

Step #1 might be tricky since we can't easily automate going through the OIDC flow. One option (preferred) is to check how the existing OAuth2 tests work. Another solution would be to log in through RAS, since that's one integration we can automate (see `RASAuthN` tests). In that case, this scenario should be tagged `@rasAuthN` and `audit-service` should be added to the [list of repos that run the RAS tests](https://github.com/uc-cdis/gen3-qa/blob/12e7844941f4f6525388aeabc20cde6bbf87525e/run-tests.sh#L288).

**Presigned URL for download: success**

1. Index file X.
2. User A has access to download file X. User A requests a presigned URL from Fence to download file X. The request is successful.
3. User B has access to query presigned URL audit logs. User B queries logs by making a call to the `GET /audit/log/presigned_url` endpoint. Use a filter: `guid=<file X GUID>`.
4. The log describing step #2 is returned. Make sure the values look right.

**Presigned URL for download: failure**

1. Index file X.
2. User C does not have access to download file X. User C requests a presigned URL from Fence to download file X. The request is unsuccessful.
3. User B has access to query presigned URL audit logs. User B queries logs by making a call to the `GET /audit/log/presigned_url` endpoint. Use a filter: `guid=<file X GUID>`.
4. The log describing step #2 is returned. Make sure the values look right.
