Peregrine is a query interface for data in Gen3 commons.

Integration Test Coverage for Peregrine :

`/graphql` is the endpoint for Peregrine.

A. Wildcard Nodes 
    
1. `node` - Query all custom node types for common fields.

2. `node : category` filter (description to be added)

3. `datanode` - Query all custom node types for data fields.

4. `_node_type` - Query the dictionary structure.

B. Submission Graph
    
1. Link resolver endpoint - This endpoint help to identify if there is a link between two nodes in the dataset. The Link resolver helps us to identify the parent-child relationship between two nodes. 

2. Count resolver endpoint - This endpoint helps us to identify the number of nodes that each node type have. The count resolver is associated with a single node.

C. User Defined Querying
    
1. Generic node - This endpoint provides the user to query with any defined properties in the dictionary for any node in the dictionary in any structure the user wants it to be in. The    user-defined structure should comply with the dictionary rules. 
    Example : 
    Correct Structure:
    ```
      Parent {
         ParentProp1,
         ParentProp2,
         Child {
            ChildProp1
         }
      }
    ```
    Incorrect Structure:
    ```
      Child {
        NotExistingProp
        Parent {
           ParentProp1
        }
        NotExisitingNode {
             NonExistingNodeProp1
        }
      }   
    ```

2. `transaction_log` - After submitting metadata with sheepdog, there should be transaction logs containing details (success/failure, entities submitted...).

D. Filters
    
1. `with_path_to`/ `with_path_to_any`/ `without_path_to` - This filter applies to the generic-node node, limiting to the nodes which possess a concrete or any relationship (could include multiple levels of relationships) to a given node type in the query.

2. `boolean` - This filter limits the result to only the node instances that have the same boolean property value as given in the filter.

3. `id` - This filter selects the node of the given UUID.

4. `ids` - This filter select nodes of the given UUIDs.	

5. `submitter_id` - This filter select nodes of the given submitter_id.	

6. `quick_search` - The quick_search filter searches for case insensitive substrings within the node UUID as well as in the unique keys of the JSONB.Currently, for simplicity and performance, only the `submitter_id` is being used in this filter.

7. `created_after` / `created_before` - This filter returns the results of datasets created depending on the date and time specified in the query.	

8. `updated_after` / `updated_before` - This filter returns the result of datasets updated depending on the date and time specified in the query.	

9. `with_links` / `with_links_any` / `without_links` - 	(description to be added)

10. `project_id` - This filter returns node/nodes with the given logical project_id.

11. `order_by_asc` / `order_by_desc` - This filter return results in a certain order - ascending or descending. This filter can take in some more parameters which can define the ordering of     the specific results.
    Example :
        ```
        project(order_by_asc: "created_datetime") {
            submitter_id
        }   
        ```    
        In the above example, the submitter_id for the particular project would be ordered in the ascending order in created_datatime. 

12. `first` - This filter truncates the result set.

13. `offset` - This filter applies offset to the head of the set and displays the result set.

Datasets Endpoints `/datasets`
```
false - Need to be logged in to see data. When logged in, only see the projects you have access to.

true - No need to be logged in. See the aggregated data for all the projects.
```

