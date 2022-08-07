Steps to configure a Host :

1. Get AWS Keys With Permissions
   - Full EC2 Access (Provisional, will narrow down)
2. Get Instance to mirror / Get network object to mirror
   - Use `list_all_network_interfaces` in [utils.ts](./utils.ts)
3. Obtain region from object obtained previously.
   - Having a known region will allow us to make mirror instances closer to the source, and thus more efficient.
4. Have user select OS for mirror instance
   - Use `get_latest_image` in [crate-ecs-instance.ts](./create-ec2-instance.ts)
   - Currently only one selectable, Ubuntu 20.04
     - Why have it selectable ? They might want to integrate it into their stack, so it's better that way.
5. Have user select instance type for mirror
   - Use `get_valid_types` in [crate-ecs-instance.ts](./create-ec2-instance.ts)
     - Requires an object of type machine specifincation which contains:
       - Min CPU cores
       - Max CPU cores
       - Min Memory
       - Max Memory
   - This will provide a set of instances compatible and the user can select one from that list.
   - On instance selection, can use `describe_type` in [crate-ecs-instance.ts](./create-ec2-instance.ts) to show specs for slected type of machine
6. Finally create a new instance
   - Use `create_new_instance` in [crate-ecs-instance.ts](./create-ec2-instance.ts)

This should create a new machine in the same region as the users machine 