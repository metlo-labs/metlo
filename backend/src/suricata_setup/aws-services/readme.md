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

Steps to configure a Traffic Mirror

1. Get a network id for the packet source
   - You can use
     - `list_all_network_interfaces` to list network interfaces
     - `list_all_instances` to list instances
       in [utils.ts](./utils.ts) and then search within that
   - Or Just ask the users to list the network interface id
2. Create a new target for mirroring from `create_mirror_target` in [create-mirrors.ts](./create-mirror.ts).
3. Create a new filter using `create_mirror_filter` in [create-mirrors.ts](./create-mirror.ts).
4. Create a new mirror session using `create_mirror_session` in [create-mirrors.ts](./create-mirror.ts).
   - This step could possibly fail. Each session requires a session number. If there's multiple sessions that accept the same packets, then it will only get mirrored to the highest session number.
